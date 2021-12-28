const fs = require("fs");
const arrMd = [];

async function formatMdAndConvertToJson() {
    //capturando todo o valor do arquivo md
    const md = await fs.readFileSync('sources/01.md', 'utf8');
    // separando pela quebra de linha
    let textMd = md.split('\n\n');
    //formatando os objetos para visualização em json
    textMd.forEach((p, i) => {
        regexSwt(p, i);
    })
    //salvando em json
    await fs.writeFileSync('sources/01.json', JSON.stringify(arrMd));

    
}

function regexSwt(str, i) {
    let p = '';
    switch (true) {
        // format h1
        case /(#.)/.test(str):
            p = str.replace(/(#.)/, '');
            arrMd.push({
                index: i,
                value: p,
                init: true
            })
            break;
        //format image
        case /\(([^()]+)\)/.test(str):
            p = str.replace(/(!.)/, '').split(']');
            arrMd.push({
                index: i,
                value: p[0],
                file: p[1],
                image: true
            })
            break;
        //format text
        case /(.)/.test(str):
            p = str;
            arrMd.push({
                index: i,
                value: p
            })
            break;
    }
}


formatMdAndConvertToJson();