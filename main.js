var fs = require ('fs'), Jimp = require('jimp'), Path = require('path'), Twit = require ('twit'), request = require('request').defaults({ encoding: null })
var probe = require('probe-image-size')

let twitter = null

let DIFF = 20
let SIZE = 1.5
let P_PIXELATE = 0.009
let MAX_WIDTH = 1200
let MAX_HEIGHT = 1200

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

function selecionarEmojis(avg, emojis) {
	r = [ ]
	let diffLocal = DIFF
	avg.forEach(linha => {
		let ultimoEmoji = null
		linha.forEach(secao => {
			emojis = shuffle(emojis)
			let emojiFile = '!'
			for(let i = 0; i < emojis.length; i++) {
				let emoji = emojis[i]
				if (isEmojiAdequado(emoji, secao, diffLocal) && emoji.arquivo !== ultimoEmoji) {
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

function addEmoji(emoji, img, pixelate) {
	let em = EMOJIS_PICTURES[emoji.arquivo]
	return new Promise(resolve => {
		em.resize(Math.ceil(pixelate*SIZE), Math.ceil(pixelate*SIZE))
		// em.rotate(randomRange(0, 350))
		img.blit(em, emoji.pos.x, emoji.pos.y)
		resolve(img)
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
		console.log('%dms', new Date() - inicio)
		Promise.all(promises).then(img => {
			console.log(img)
			console.log('%dms', new Date() - inicio)
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
	}
	return img
}

function getImage(url) {
	return new Promise(resolve => {
		Jimp.read(url)
			.then(img => {
				resolve (img)
			})
	})
}

function getParams(txt) {
	let params = {
		pixelate: P_PIXELATE,
		emoji_size: SIZE,
		width: MAX_WIDTH,
		height: MAX_HEIGHT
	}
	try {
		if (txt.indexOf('detalhe ') !== -1) {
			if (txt.indexOf('detalhe 0') !== -1) params.pixelate = 0.025
			if (txt.indexOf('detalhe 1') !== -1) params.pixelate = 0.016
			if (txt.indexOf('detalhe 2') !== -1) params.pixelate = 0.01
			if (txt.indexOf('detalhe 4') !== -1) params.pixelate = 0.0085
			if (txt.indexOf('detalhe 5') !== -1) params.pixelate = 0.008
		}
		if (txt.indexOf('max_wh ') !== -1) {
			if (txt.indexOf('max_wh 0') !== -1) params.width = 1200
			if (txt.indexOf('max_wh 1') !== -1) params.width = 1400
			if (txt.indexOf('max_wh 2') !== -1) params.width = 1800
			if (txt.indexOf('max_wh 3') !== -1) params.width = 2600
			if (txt.indexOf('max_wh 99') !== -1) params.width = 9999
			params.height = params.width
		}
	} catch (error) {

	}

	return params
}

function mentionEvent(tweet) {
	try {
		if (tweet.entities.media.length > 0) {
			params = getParams(tweet.text)
			let url = tweet.entities.media[0].media_url
			return new Promise(resolve => {
				getImage(url)
					.then(img => {
						emojify(img, tweet, params)
						resolve(1)
					})
			})
		}
	} catch (error) {
		console.log('[XXX] ERRO [XXX}')
		console.log(error)
	}
}

function twitar(img, tweet) {
	twitter.post('media/upload', { media_data: img }, function (err, data, response) {
		// now we can assign alt text to the media, for use by screen readers and
		// other text-based presentations and interpreters
		var mediaIdStr = data.media_id_string
		var meta_params = { media_id: mediaIdStr }

		twitter.post('media/metadata/create', meta_params, function (err, data, response) {
		  if (!err) {
			var params = { status: '@' + tweet.user.screen_name + ' Oi ' + tweet.user.name + '!', media_ids: [mediaIdStr], in_reply_to_status_id: tweet.id }

			twitter.post('statuses/update', params, function (err, data, response) {
				console.log('postei!')
			})
		  }
		})
	})
}

function getTwitter() {
	let keys = readJson(Path.join('twitter_keys', 'keys.json'))
	twitter = new Twit({
		consumer_key:         keys.key,
		consumer_secret:      keys.secret,
		access_token:         keys.token,
		access_token_secret:  keys.token_secret,
		timeout_ms:           60*1000,
		strictSSL:            true,
	  })
}

function emojify(img, tweet, params) {
	img = resize(img, params)
	console.log(Math.ceil(img.bitmap.width * params.pixelate))
	transformarImg(img, Math.ceil(img.bitmap.width * params.pixelate))
		.then(img => {
			img.quality(70)
			console.log(2)
			img.getBufferAsync(Jimp.MIME_JPEG)
				.then(buffer => {
					console.log(2)
					let base64 = buffer.toString('base64')
					console.log('indo postar tweet!')
					twitar(base64, tweet)
					console.log(2)
				})
		})
}

function main() {
	readEmojis(readJson('emojis.json'))
		.then(() => {
			getTwitter()
			let stream = twitter.stream('statuses/filter', { track: '@emojify1' })
			stream.on('tweet', mentionEvent)
			console.log('Começaaaaaaaando!')
			console.log('%dms', new Date() - inicio)
		})

}




main()