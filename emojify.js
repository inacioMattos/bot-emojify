var fs = require ('fs'), Jimp = require('jimp'), Path = require('path')

let DIFF = 25
let SIZE = 1.5
let P_PIXELATE = 0.008
let MAX_WIDTH = 2600
let MAX_HEIGHT = 2600
let MIN_WIDTH = 900
let MIN_HEIGHT = 900

let inicio = new Date()
let EMOJIS_PICTURES = { }



function getPixels(img) {
  let pixels = [ ]
  for (let i = 0; i < img.bitmap.height; i++) pixels.push([])
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
    let colors = [ ]
    colors[0] = img.bitmap.data[idx]
    colors[1] = img.bitmap.data[idx + 1]
    colors[2] = img.bitmap.data[idx + 2]
    colors[3] = img.bitmap.data[idx + 3]
    pixels[y].push(colors)
  })

  return pixels
}

function readJson(path) {
  let data = fs.readFileSync(path)
  return JSON.parse(data)
}

function shuffle(a) {
    var j, x, i;
    for (i = Math.ceil(a.length - 1); i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function pixelateLista(pixels, pixelate) {
  let r = [ ]
  for (let iy = 0; iy < pixels.length; iy += pixelate) {
    let rx = [ ]
    let y = iy
    if (iy + pixelate < pixels.length) {
      y = iy + Math.floor(pixelate/2)
    }
    for (let ix = 0; ix < pixels[0].length; ix += pixelate) {
      let x = ix
      if (ix + pixelate < pixels.length) {
        x = ix + Math.floor(pixelate/2)
      }
      rx.push({
        pos: {
          x: ix,
          y: iy
        },
        color: {
          r: pixels[iy][ix][0],
          g: pixels[iy][ix][1],
          b: pixels[iy][ix][2]
        }
      })
    }
    r.push(rx)
  }
  return r
}

function isEmojiAdequado(emoji, secao, diffLocal) {
  if (secao.color.r > emoji.avg[0] - diffLocal && secao.color.r < emoji.avg[0] + diffLocal) {
    if (secao.color.g > emoji.avg[1] - diffLocal && secao.color.g < emoji.avg[1] + diffLocal) {
      if (secao.color.b > emoji.avg[2] - diffLocal && secao.color.b < emoji.avg[2] + diffLocal) {
        return true
      }
    }
  }
  return false
}

function selecionarEmojis(avg, emojis, params) {
  r = [ ]
  let diffLocal = params.diff
  avg.forEach(linha => {
    linha.forEach(secao => {
      if (!params.retro) emojis = shuffle(emojis)
      let emojiFile = '!'
      for(let i = 0; i < emojis.length; i++) {
        let emoji = emojis[i]
        if (isEmojiAdequado(emoji, secao, diffLocal)) {
          emojiFile = emoji.arquivo
          i = emojis.length
        }
      }
      if (emojiFile === '!') {
        diffLocal++
        emojiFile = emojis[0].arquivo
      }
      ultimoEmoji = emojiFile
      r.push({
        arquivo: emojiFile,
        pos: {
          x: secao.pos.x,
          y: secao.pos.y
        }
      })
    })
  })
  return r
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function addEmoji(emoji, img, pixelate, params) {
  let em = EMOJIS_PICTURES[emoji.arquivo].clone()
  return new Promise(resolve => {
    em.resize(Math.ceil(pixelate*params.emoji_size), Math.ceil(pixelate*params.emoji_size))
    img.blit(em, emoji.pos.x, emoji.pos.y)
    resolve(img)
  })
}

function addEmojis(emojis, w, h, pixelate, img, params) {
  promises = [ ]
  let emoji = emojis[0]
  return new Promise(resolve => {
    emojis.forEach(emoji => {
      promises.push(addEmoji(emoji, img, pixelate, params))
    })
    console.log('%dms', new Date() - inicio)
    Promise.all(promises).then(img => {
      console.log(img)
      console.log('%dms', new Date() - inicio)
      resolve(img[0])
    })
  })
}

function transformarImg(img, pixelate, params) {
  return new Promise(resolve => {
    img.pixelate(pixelate) // parametro que define a cada quantos pixels deve ser 1. N:1
    let pixels = getPixels(img) // função que retorna um array com 3 dimensoes, pixels[y][x][rgba] onde rgba é um int de 0 a 3
    avgImg = pixelateLista(pixels, pixelate)

    emojis = readJson('emojis.json')
    emojisSelecionados = selecionarEmojis(avgImg, emojis, params)

    addEmojis(emojisSelecionados, img.bitmap.width, img.bitmap.height, pixelate, img, params)
      .then(img => {
        resolve(img)
      })
  })
}

function emojiToVar(emoji) {
  return new Promise(resolve => {
    Jimp.read(Path.join('emojis', emoji.arquivo))
      .then(img => {
        // img.quality(40)
        EMOJIS_PICTURES[emoji.arquivo] = img
        resolve(true)
      })
  })
}

function readEmojis(jsonEmojis) {
  promises = [ ]
  jsonEmojis.forEach(emoji => {
    promises.push(emojiToVar(emoji))
  })
  return new Promise(resolve => {
    Promise.all(promises)
      .then(() => {
        resolve(true)
      })
  })
}

function resize(img, params) {
  let x = img.bitmap.width
  let y = img.bitmap.height
  if (x/y > 50 || x/y < 0.02) {
    if (x > params.width) x = params.width
    if (y > params.height) y = params.height
    return img
  }
  if (x > params.width || y > params.height) {
    if (x < y) {
      let aspectRatio = y/x
      y = params.height
      x = Math.floor(y / aspectRatio)
    } else {
      let aspectRatio = x/y
      x = params.width
      y = Math.floor(x / aspectRatio)
    }
    img.resize(x, y)
    return img
  } else if (x < MIN_WIDTH || y < MIN_HEIGHT) {
    if (x > y) {
      let aspectRatio = y/x
      y = MIN_HEIGHT * 1.4
      x = Math.floor(y / aspectRatio)
    } else {
      let aspectRatio = x/y
      x = MIN_WIDTH * 1.4
      y = Math.floor(x / aspectRatio)
    }
    img.resize(x, y)
    return img
  }
  return img
}

function main() {
  let params = {
    pixelate: P_PIXELATE,
    emoji_size: SIZE,
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
    retro: false,
    diff: DIFF
  }
  readEmojis(readJson('emojis.json'))
    .then(() => {
      console.log('Começaaaaaaaando!')
      console.log('%dms', new Date() - inicio)
      Jimp.read('img.jpg')
        .then(img => {
          emojify(img, params)
            .then(imgFinal => {
              imgFinal.write('img-pos.jpg')
            })
        })
    })

}

function emojify(img, params) {
  img = resize(img, params)
  console.log(Math.ceil(img.bitmap.width * params.pixelate))
  return new Promise(resolve => {
    transformarImg(img, Math.ceil(img.bitmap.width * params.pixelate), params)
      .then(img => {
        img.quality(70)
        resolve(img)
      })
  })
}


main()
