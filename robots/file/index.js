const fs = require("fs");
const imageDownloader = require('image-downloader');
const arrMd = [];
const config = require('../../config');

async function robot() {
    console.log('> [file-robot] -> Starting...');
    //await formatMdAndConvertToJson();
    console.log('> [file-robot] -> file MD converting to JSON with Success');
    await formatToTweets();
    console.log('> [file-robot] -> Ready to POSTING TWEETS');
}


async function formatMdAndConvertToJson() {
    try {
        let files = await fs.readdirSync(config.dir.thread);
        let folder = files.filter(f => {
            return /md/.test(f) ? false : true;
        })[0]
        let file = files.filter(f => {
            return /md/.test(f) ? true : false;
        })[0];
        //capturando todo o valor do arquivo md
        const md = await fs.readFileSync(config.dir.thread + file, 'utf8');
        //rename folder
        await fs.renameSync(config.dir.thread + folder, config.dir.thread + config.folder);
        console.log('> [file-robot] -> folder rename with success!');
        // separando pela quebra de linha
        let textMd = md.split('\n\n');
        //formatando os objetos para visualização em json
        await fs.renameSync(config.dir.thread + config.folder, config.dir.content + config.folder);

        for (const [i, p] of textMd.entries()) {
            await regexSwt(p, i);
        }
        //salvando em json
        console.log('> [file-robot] -> file created in :' + config.dir.json + file + '.json');
        await fs.writeFileSync(config.dir.json + file + '.json', JSON.stringify(arrMd));
    } catch (e) {
        console.log('> [file-robot] -> error', e.messege);
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
                        objTweet[0].image = t.value;
                    } else {
                        let img = t.value;
                        objTweet.push({
                            image: img,
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
                    } else if (objTweet[c].image && objTweet[c].text && c != 0 && !t.font) {
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
        let restoTexto = '';

        objTweet = objTweet.map((t) => {
            let ajustesTexto = ajustarTexto({
                textoOriginal: t.text,
                restoTexto: restoTexto,
                concatenarTextos: true
            });
            restoTexto = ajustesTexto.restoTexto;
            t.text = ajustesTexto.textoAjustado;
            return t;
        })

        if (restoTexto != '') {
            do {
                let ajustesTexto = ajustarTexto({
                    textoOriginal: restoTexto,
                    restoTexto: restoTexto,
                    concatenarTextos: false
                });

                restoTexto = ajustesTexto.restoTexto;

                objTweet.push({
                    'text': ajustesTexto.textoAjustado
                })
            } while (restoTexto != '')
        }
        //salvando em json
        await fs.writeFileSync(config.dir.finished + config.state, JSON.stringify(objTweet));
        console.log('> [file-robot] -> json created in: ' + config.dir.finished + config.state);
        //apagando arquivo que não será usado novamente
        // await fs.unlinkSync(config.dir.json + files[0]);
        // console.log('> [file-robot] -> file deleded in: ' + config.dir.json + files[0])
        //delete file md
        // let filesThread = await fs.readdirSync(config.dir.thread);
        // let fileMd = filesThread.filter(f => {
        //     return /md/.test(f) ? true : false;
        // })[0];
        // let folderMd = filesThread.filter(f => {
        //     return /md/.test(f) ? false : true;
        // })[0]
        // await fs.unlinkSync(config.dir.thread + fileMd);
        // console.log('> [file-robot] -> file deleded in: ' + config.dir.thread + fileMd);



    } catch (e) {
        console.log('> [file-robot] -> error', e);
    }
}

function ajustarTexto(params) {
    let { textoOriginal, restoTexto, concatenarTextos } = params;

    if (concatenarTextos) textoOriginal = restoTexto + ' ' + textoOriginal;

    let txtRest = '';
    //array de palavras
    let p = textoOriginal.split(' ');
    restoTexto = '';

    let montandoTexto = true;

    // vai receber o total de palavras no texto
    txtRest = p.reduce((texto, palavra) => {

        // irá adicionar a palavra apenas se couber E se ainda estiver montando o texto atual.
        if ((texto.length + palavra.length + 4) < config.twitter.limit && montandoTexto) {
            texto = texto + ' ' + palavra;
        } else {
            // se for a primeira vez que está entrando no else (se ainda está montando o texto), adiciona os 3 pontinhos no final
            if (montandoTexto) {
                texto = texto + '...';
                restoTexto = '...' + restoTexto.trim();
            }

            // ao nao conseguir encaixar a proxima palavra, define a variavel como false. impedindo que palavras menores sejam adiconadas ao texto atual
            montandoTexto = false;

            // salva as palavras que excedem o limite de caracteres para utiliza-las no próximo texto
            restoTexto = restoTexto + ' ' + palavra;
        }

        // retorna o texto montado no tamanho máximo possivel
        return texto.trim();
    }, '');

    return {
        textoAjustado: txtRest,
        restoTexto: restoTexto
    }
}

async function regexSwt(str, i) {
    try {
        let p = '';
        switch (true) {
            // format h1
            case /(^)(#)(\s)/.test(str):
                p = str.replace(/(#.)/, '');
                arrMd.push({
                    index: i,
                    value: p,
                    init: true
                })
                break;
            //format h2,h3...
            case /(#{2})(\s)/.test(str):
                p = str.replace(/(#.)/g, '');
                arrMd.push({
                    index: i,
                    value: p,
                })
                break;
            //format fonte
            case /^[*]/.test(str):
                p = str.replace(/([[])|\(([^()]*)\)|(!.)|(])|([*])/g, '\n');
                arrMd.push({
                    index: i,
                    value: p,
                    font: true
                })
                break;

            //format image
            case /(^!.)/g.test(str):
                p = str.replace(/(^!.)/g, '').split(']');
                let file = p[1];

                file = file.split('');
                file.pop();
                file.shift();
                file = file.join('');


                if (!/(https)|(http)/.test(file)) {
                    file = file.replace(/((.*)[/])/, '');
                } else {
                    let fileName = (Math.random() + 1).toString(36).substring(4) + '.jpg';
                    await downloadAndSave(file, fileName);
                    console.log(`> [file-robot] -> Image successfully downloaded: ${fileName}`)
                    file = fileName;
                }

                arrMd.push({
                    index: i,
                    value: file,
                    file: config.folder,
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
    } catch (e) {
        throw new Error('erro no regex de transformação de md para json');
    }

}

async function downloadAndSave(url, fileName) {
    return await imageDownloader.image({
        url: url,
        dest: `${config.dir.content}${config.folder}/${fileName}`
    })
}


module.exports = robot;

