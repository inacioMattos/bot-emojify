# Emojify 

O Emojify é um perfil no twitter que emojifica todas as imagens que enviam para ele! O perfil dele é www.twitter.com/emojify1

## Como ele transforma imagens em emojis?
Podemos dividir a lógica em duas principais etapas: pixalizar a imagem e selecionar quais emojis irão em qual parte da imagem. A parte de pixalizar eu utilizei uma lib chamada Jimp que fez isso, já a etapa de decidir qual emoji utilizar em qual parte da imagem foi um algoritmo que eu mesmo bolei, **justamente por isso**, provavelmente existem algoritmos mais eficientes.

### Mas como exatamente ele seleciona os emojis?
Basicamente, o algoritmo todo gira em torno da cor média de cada seção e cada emoji, por exemplo: se temos uma determinada seção de 10x10px com 4 valores (RGBA) para cada um dos 100 pixels, é somado cada um desses 300 valores (pois o canal Alpha é ignorado) e é feito uma média desses valores. Digamos por exemplo que o resultado seja: (103, 45, 244), o algoritmo procura dentro de um JSON um emoji com cor média semelhante a essa obtida desta seção da imagem. Naturalmente, a chance de haver um emoji com a exata cor média de (103, 45, 244) é muito pequena, por isso é utilizado um parametro interno DIFF que determina a diferença possível de média de cor que é aceita. Para quem curiodade, a DIFF é em torno de 25.

## Como rodar no meu computador?
É bem fácil, basta clonar esse repositório e adicionar uma pasta chamada "twitter_keys" e dentro dela um JSON com as APIs keys da tua conta do twitter. Tem vários tutorias na internet mostrando como conseguir suas keys da API do Twitter.
Depois disso, é só rodar o clássico 'npm install' e depois 'node main.js'.
