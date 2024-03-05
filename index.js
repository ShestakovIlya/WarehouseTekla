const fs = require('fs');
const path = require('path');
const writeFilePromise = require('util').promisify(fs.writeFile);
const download = require('download');
require("net").setDefaultAutoSelectFamily(false);

console.log("begin");
const loadDir = 'LoadingData';
const infoDir = 'infodata';
const saveDir = 'data';

//LoadingPackages(0, 1000);
//LoadingPackages(1000, 1000);
//LoadingPackages(2000, 1000);
//LoadingPackages(3000, 1000);
//LoadingPackages(4000, 1000);
//LoadingPackages(5000, 1000);

//LoadingInfoData(infoDir)

//DefinitionGUIDDir(loadDir);

//GroupyByData(infoDir);

//Группировка по каталогам
async function GroupyByData(rootDir)
{
    let jsonPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'saveData.json'), 'utf8'));   
    for(let i=0; i<=5;i++){
        let jsonWebData = JSON.parse(fs.readFileSync(path.join(rootDir, `infoData${i}.json`), 'utf8')).entries;
        for(let j = 0; j  < jsonWebData.length; j++){            
            if(jsonPackage[jsonWebData[j].id]!= null) 
            {
                let dirItem = jsonPackage[jsonWebData[j].id].nameDir.trim();
                if(!fs.existsSync(dirItem)) continue;
                if(jsonPackage[jsonWebData[j].id].categories.trim() == "rebar,environmentFile" || 
                    jsonPackage[jsonWebData[j].id].categories.trim() == 'environmentFile,rebar' || 
                    jsonPackage[jsonWebData[j].id].categories.trim() == 'rebar'){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Файлы сред/Арматура`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "environmentFile,bolt" || 
                    jsonPackage[jsonWebData[j].id].categories.trim() == "bolt"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Файлы сред/Болты`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "environmentFile,profile" || 
                jsonPackage[jsonWebData[j].id].categories.trim() == "profile" ){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Файлы сред/Профили`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "tool" || 
                jsonPackage[jsonWebData[j].id].categories.trim() == "application"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Приложения`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "modelSetup"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Файлы сред/Файлы настроек моделей`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "drawingSetup"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Файлы сред/Файлы настроек чертежей`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "customComponent"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Пользовательские компоненты`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "3dProduct"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/3D-изделия`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "reportTemplate"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Шаблоны отчетов`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "environmentFile"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Файлы сред/Разное`))
                }
                else if(jsonPackage[jsonWebData[j].id].categories.trim() == "shape"){
                    fs.renameSync(dirItem, dirItem.replace(`${loadDir}`,`${saveDir}/Формы`))
                }
            }            
        }
    }
}

//Определение GUID каталогов и сохранения результатов в json
async function DefinitionGUIDDir(rootDir)
{
    const items = await fs.readdirSync(rootDir)
                        .map(file => path.join(rootDir, file))
                        .filter(path => fs.statSync(path).isDirectory());
    let jsonEntities ={}
    for (const item of items) {
        let categories = 'none';
        if( fs.readdirSync( path.join(item, 'packages')).length == 0) categories = 'delete'
        let packageFile =  path.join(item, 'package.json')
        if (!fs.existsSync(packageFile)) continue;
        var jsonPackage = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        if(jsonPackage.attributes.itemTypeCategories && categories != 'delete') categories = Object.keys( jsonPackage.attributes.itemTypeCategories);
        jsonEntities[`${jsonPackage.id}`] = {'nameDir':`${item}`, 'categories': `${categories}`}
    }
    fs.writeFileSync(`${infoDir}/saveData.json`, JSON.stringify(jsonEntities));
}

//Загрузка информации по всем каталогам с ресурса
async function LoadingInfoData(dirSave){
    let offset = 0;
    for(let i=0; i<=5;i++){
        await download(`https://warehouse.tekla.com/warehouse/v1.0/packages?offset=${offset}&count=1000&sortBy=modifyTime%20DESC&showBinaryMetadata=true&showAttributes=true&contentType=TWH&fq=(type==TEKLA_WAREHOUSE_PACKAGE)&lang=ru`
        , dirSave,{filename: `infoData${i}.json`})
        offset += 1000;
    }
}

//Загрузка пакетов со смещением не более 1000 за запрос
function LoadingPackages(beginIndex, countItems){
    RequestPage('https://warehouse.tekla.com/warehouse/v1.0/packages?offset='+beginIndex+'&count='+countItems+'&sortBy=modifyTime%20DESC&showBinaryMetadata=true&showAttributes=true&contentType=TWH&fq=(type==TEKLA_WAREHOUSE_PACKAGE)&lang=ru')
    .then(async (response) => {
        
        const data = await response.json();        
        
        for(let i=0;i<data.entries.length;i++){
            let item = data.entries[i];
            console.log(`${(i+1)} https://warehouse.tekla.com/warehouse/v1.0/packages/${item.id}`)
            await RequestPage(`https://warehouse.tekla.com/warehouse/v1.0/packages/${item.id}`)
            .then(async (res)=>{            
                item = await res.json();
            })
            .catch(() =>{})

            let dirItem = `${loadDir}/packages/${item.title.replace(/[\u002F*|:]/g,".").replace(/["]/g,"").trim()}`;
            fs.mkdirSync(dirItem, { recursive: true }) 
            fs.mkdirSync(`${dirItem}/packages`, { recursive: true })
            for (var key in item.binaries) {
                if(item.binaries[key].url != undefined){
                    if(key.indexOf("thumbnail") == -1) continue;
                    await download(item.binaries[key].url, dirItem,{filename: item.binaries[key].originalFileName})
                    .catch(error=>console.log(`error save thumbnail: ${item.binaries[key].originalFileName}`));
                    break;
                }
            }
            await download(`https://warehouse.tekla.com/warehouse/v1.0/packages/${item.id}?lang=ru`, dirItem,{filename: `package.json`})
            .catch(()=>console.log(`error save package.json: ${dirItem}`));
            let entities = 
            await download(`https://warehouse.tekla.com/warehouse/v1.0/entities?fq=parentCollectionId%3D%3D${item.id}%3B(type%3D%3DTEKLA_WAREHOUSE_VERSION)&sortBy=relevance+DESC&offset=0&count=500&showBinaryMetadata=true&showAttributes=true&contentType=TWH&lang=ru&personalizeSearch=true`, dirItem,{filename: `entities.json`})
            .then(()=>JSON.parse(fs.readFileSync(`${dirItem}/entities.json`)))
            .catch(error=>console.log(`error save entities.json: ${dirItem}`));
            
            fs.writeFileSync(`${dirItem}/info.txt`, `${item.description}\n\n\n${item.details}`);

            if(entities == null) continue;
            for(let j = 0;j <  entities.entries.length; j++){
                for (var key in entities.entries[j].binaries) {
                    let entitie = entities.entries[j].binaries[key];
                    if(entitie.url == undefined) continue;
                    let saveName = `${dirItem}/packages/${entitie.originalFileName.replace(`.${entitie.ext}`,  `[${entities.entries[j].title.replace(/[\u002F*<>|:]/g,"").replace('->', "")}].${entitie.ext}`)}`;
                    await DownloadResource(`${entitie.url}`, saveName);
                }
            }
        };
      
    })
    .catch(reject =>{
        console.log(`error RequestPage:`);
        console.log(reject);
    })
}

//Запрос любого json ресурса
function RequestPage(url) {
    return fetch(url, 
        {
            method: "GET",
            headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            }
        }
    )
}

//Загрузка файлов с ресурса по url
async function DownloadResource(url, nameFile) {
    return await fetch(url, 
        {
            method: "GET",
            headers : { 
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
                'Accept-Encoding': 'gzip, deflate, br',
                Cookie: '_fbp=fb.1.1689080659300.1943113909; '+
                        'cookies.settings=eyJlbmFibGVQZXJmb3JtYW5jZUNvb2tpZXMiOnRydWUsImVuYWJsZVRhcmdldGluZ0Nvb2tpZXMiOnRydWUsInVzZXJBY3Rpb25UYWtlbiI6dHJ1ZX0=; '+
                        '_hjSessionUser_474247=eyJpZCI6Ijc3NzRjOTAyLThkYzUtNTViMS1hNzkyLWYxYmEyYWRjYTk5ZiIsImNyZWF0ZWQiOjE2ODkwODA2NTg3MTgsImV4aXN0aW5nIjp0cnVlfQ==; '+
                        'locale=ru_RU; _ga_111JYD0P9Z=GS1.1.1689080657.1.1.1689081204.0.0.0; whp_unique=9dffa4ae-4d0f-4d73-9c22-394cb13948f2; '+
                        '_gcl_au=1.1.987158341.1707808560; _mkto_trk=id:093-TQY-221&token:_mch-tekla.com-1689080657782-20120; _gid=GA1.2.2002249539.1709194474; '+
                        'idpsvu=2024-04-01T00:49:25.902Z; 3dw_ticket=6b16f7a6-fccc-474c-8d06-81ce3c32ca74; _ga=GA1.1.1454378870.1689080658; '+
                        'SEARCH_PAGE_VIEW_STATE={%22sortBy%22:%22-modifiedAt%22}; _ga_X88YXSWCN1=GS1.1.1709340515.25.1.1709340706.0.0.0'
            }
        }
    )
    .then(obj =>{
        if(obj.status != 200){
            console.log("error[DownloadResource-Status] : "+ obj.status)
            fs.appendFileSync(`errors.log`, `${nameFile} status: ${obj.status}\n`);
            return null;
        }
        return obj.arrayBuffer()
    })
    .then(async x => {
        await writeFilePromise(nameFile, Buffer.from(x))
        console.log(`->file save: ${nameFile}`)
    })
    .catch(x=>{        
        console.log("error[DownloadResource] : "+nameFile);        
        console.log(x);
        fs.appendFileSync(`errors[DownloadResource].log`, `${nameFile}\n`);
    })
}