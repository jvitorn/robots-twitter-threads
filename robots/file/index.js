const fs = require("fs");
const sbd = require("sbd");
const arrMd = [];


const config = require('../../config');

async function robot() {
    //await formatMdAndConvertToJson();
    await formatToTweets();
}


async function formatMdAndConvertToJson() {
    try {
        let files = await fs.readdirSync(config.dir.thread);
        files = files.filter(f => {
            return /md/.test(f) ? true : false;
        })
        //capturando todo o valor do arquivo md
        const md = await fs.readFileSync(config.dir.thread + files[0], 'utf8');
        // separando pela quebra de linha
        let textMd = md.split('\n\n');
        //formatando os objetos para visualização em json
        textMd.forEach((p, i) => {
            regexSwt(p, i);
        })
        //salvando em json
        await fs.writeFileSync(config.dir.json + files[0] + '.json', JSON.stringify(arrMd));
        process.exit(0);
    } catch (e) {
        console.log('erro', e);
        process.exit(1);
    }


}
async function formatToTweets() {
    try {
        //localizando arquivos json
        let files = await fs.readdirSync(config.dir.json);
        //armazenando arquivo
        let state = await fs.readFileSync(config.dir.json + files[0], 'utf8');
        //salvando como objeto
        state = JSON.parse(state);
        /*        
        * logica para os tweets será o seguinte
        * 1 - cada tweet deverá ter 1 imagem vinculada x
        * 2 - cada tweet não pode ultrapassar 280 caracters
        * 3 - se o texto/frase ultrapassar 280 caracteres, 
        * deverá ser adicionado toda a frase no proximo tweet
        * 4 - o primeiro tweet será sempre o titulo da thread e deverá 
        * ser exclusivo no twite x 
        */
        // objeto na qual será formatado os tweets para enviar na api do twitter 
        let objTweet = [];
        state.forEach((t, i) => {
            //tweets e tweets com imagem
            switch (true) {
                case t.image:
                    if (i - 1 === 0) {
                        objTweet[0].image = t.file;
                    } else {
                        objTweet.push({
                            image: t.file,
                        })
                    }
                    break;
                case t.init:
                    objTweet.push({
                        text: t.value,
                    })
                    break;
                default:
                    let c = objTweet.length - 1;
                    if (objTweet[c].image && !objTweet[c].text && c != 0) {
                        objTweet[c].text = t.value;
                    } else if (!objTweet[c].image && objTweet[c].text) {
                        objTweet[c].text = t.value;
                    } else if (objTweet[c].image && objTweet[c].text && c != 0) {
                        objTweet[c].text += t.value;
                    }
                    else {
                        objTweet.push({
                            text: t.value,
                        })
                    }
                    break;
            }
        })
        //logica para caracteres do twitter
        let objTeste = [];
        let restoTexto = '';

        objTweet = objTweet.map((t) => {
            t.text = restoTexto + ' ' + t.text;
            restoTexto = '';
            //array de palavras
            let p = t.text.split(' ');
            // vai receber o total de palavras no texto
            t.text = p.reduce((texto, palavra) => {
                if ((texto.length + palavra.length) < config.twitter.limit) {
                    texto = texto + ' ' + palavra;
                } else {
                    restoTexto = restoTexto + ' ' + palavra;
                }
                return texto;

            }, '')
            return t;
        })
        if (restoTexto != '') {
            do {
                let txtRest = '';
                //array de palavras
                let p = restoTexto.split(' ');
                restoTexto = '';
                // vai receber o total de palavras no texto
                txtRest = p.reduce((texto, palavra) => {
                    if ((texto.length + palavra.length) < config.twitter.limit) {
                        texto = texto + ' ' + palavra;
                    } else {
                        restoTexto = restoTexto + ' ' + palavra;
                    }
                    return texto;

                }, '')
                objTweet.push({
                    'text': txtRest
                })
            } while (restoTexto != '')

            console.log('objTweet ->', objTweet);

        }
        // objTweet.forEach((t,i) => {
        //     do {
        //         const liT = t.text.split(',');
        //         liT.forEach((l,id)=>{
        //             console.log(l.length + l[id].length);
        //         })
        //         idx++;  5495
        //     } while (t.text.length > config.twitter.limit);
        // })

        //salvando em json
        await fs.writeFileSync(config.dir.json + 'teste.json', JSON.stringify(objTweet));

    } catch (e) {
        console.log('error', e)
        process.exit(1);
    }
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


robot();

