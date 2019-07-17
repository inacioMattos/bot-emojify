var fs = require ('fs'), Jimp = require('jimp')


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

function main() {
	Jimp.read('img.jpg')
	.then(img => {
		let pixels = getPixels(img) // função que retorna um array com 3 dimensoes, pixels[y][x][rgba] onde rgba é um int de 0 a 3


		img.
	})
}




main()