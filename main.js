var fs = require ('fs'), Jimp = require('jimp')


let DIFF = 50
let SIZE = 1.5
let P_PIXELATE = 0.01
let mainColor = {
	r: 0,
	g: 0,
	b: 0
}


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
    for (i = a.length - 1; i > 0; i--) {
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

function isEmojiAdequado(emoji, secao) {
	if (secao.color.r > emoji.avg[0] - DIFF && secao.color.r < emoji.avg[0] + DIFF) {
		if (secao.color.g > emoji.avg[1] - DIFF && secao.color.g < emoji.avg[1] + DIFF) {
			if (secao.color.b > emoji.avg[2] - DIFF && secao.color.b < emoji.avg[2] + DIFF) {
				return true
			}
		}
	}
	return false
}

function selecionarEmojis(avg, emojis) {
	r = [ ]

	avg.forEach(linha => {
		linha.forEach(secao => {
			emojis = shuffle(emojis)
			let emojiFile = emojis[0].arquivo
			for(let i = 0; i < emojis.length; i++) {
				let emoji = emojis[i]
				if (isEmojiAdequado(emoji, secao)) {
					emojiFile = emoji.arquivo
					i = emojis.length
				}
			}
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

function addEmoji(emoji, img, pixelate) {
	return new Promise(resolve => {
		Jimp.read('emojis\\' + emoji.arquivo)
			.then(em => {
				em.resize(Math.ceil(pixelate*SIZE), Math.ceil(pixelate*SIZE))
				em.rotate(randomRange(0, 350))
				img.blit(em, emoji.pos.x, emoji.pos.y)
				resolve(img)
			})
	})
}

function addEmojis(emojis, w, h, pixelate, img) {
	// img.pixelate(img.bitmap.width)
	promises = [ ]
	let emoji = emojis[0]
	return new Promise(resolve => {
		emojis.forEach(emoji => {
			promises.push(addEmoji(emoji, img, pixelate))
		})
		Promise.all(promises).then(img => {
			console.log(img)
			resolve(img[0])
		})
	})
}

function transformarImg(img, pixelate) {
	return new Promise(resolve => {
		img.pixelate(pixelate) // parametro que define a cada quantos pixels deve ser 1. N:1
		let pixels = getPixels(img) // função que retorna um array com 3 dimensoes, pixels[y][x][rgba] onde rgba é um int de 0 a 3
		avgImg = pixelateLista(pixels, pixelate)

		emojis = readJson('emojis.json')
		emojisSelecionados = selecionarEmojis(avgImg, emojis)

		addEmojis(emojisSelecionados, img.bitmap.width, img.bitmap.height, pixelate, img)
			.then(img => {
				resolve(img)
			})
	})
}

function main() {
	Jimp.read('img.jpg')
	.then(img => {
		console.log(Math.ceil(img.bitmap.width * P_PIXELATE))
		transformarImg(img, Math.ceil(img.bitmap.width * P_PIXELATE))
			.then(img => {
				img.write('img-pos.jpg')
			})
	})
}




main()