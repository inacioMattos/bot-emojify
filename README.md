### [EDIT]: O sistema de detecção automática de bots maliciosos do Twitter suspensou INDEVIDAMENTE a conta emojify1, para mais informações leia abaixo.

# Emojify 

O Emojify é um perfil no twitter que emojifica todas as imagens que enviam para ele! O perfil dele é www.twitter.com/emojify1

## DEMO: Clique na imagem emojificada.
Abaixo estão algumas imagens emojificadas, para ver com mais detalhes e no seu tamanho real: **clique** na imagem emojificada.

![alt-text](https://imgur.com/YDALbmi.jpg)
![alt-text](https://imgur.com/60eJgzh.jpg)
![alt-text](https://i.imgur.com/1pXiDop.jpg)
![alt-text](https://i.imgur.com/5D4t54a.jpg)
![alt-text](https://imgur.com/VPVpBVu.jpg)
![alt-text](https://imgur.com/J6e5fwh.jpg)

## Como ele transforma imagens em emojis?
Podemos dividir a lógica em duas principais etapas: pixalizar a imagem e selecionar quais emojis irão em qual parte da imagem. A parte de pixalizar eu utilizei uma lib chamada Jimp que fez isso, já a etapa de decidir qual emoji utilizar em qual parte da imagem foi um algoritmo que eu mesmo bolei, **justamente por isso**, provavelmente existem algoritmos mais eficientes.

### Mas como exatamente ele seleciona os emojis?
Basicamente, o algoritmo todo gira em torno da cor média de cada seção e cada emoji, por exemplo: se temos uma determinada seção de 10x10px com 4 valores (RGBA) para cada um dos 100 pixels, é somado cada um desses 300 valores (pois o canal Alpha é ignorado) e é feito uma média desses valores. Digamos por exemplo que o resultado seja: (103, 45, 244), o algoritmo procura dentro de um JSON um emoji com cor média semelhante a essa obtida desta seção da imagem. Naturalmente, a chance de haver um emoji com a exata cor média de (103, 45, 244) é muito pequena, por isso é utilizado um parametro interno DIFF que determina a diferença possível de média de cor que é aceita. Para quem curiodade, a DIFF é em torno de 25.

## Como rodar no meu computador?
É bem fácil, basta clonar esse repositório e adicionar uma pasta chamada "twitter_keys" e dentro dela um JSON com as APIs keys da tua conta do twitter. Tem vários tutorias na internet mostrando como conseguir suas keys da API do Twitter.
Depois disso, é só rodar o clássico 'npm install' e depois 'node main.js'.

## Suspensão do Twitter
O Twitter retirou o perfil do ar e excluiu todos os tweets do mesmo pois o sistema de detecção de bots maliciosos do Twitter é falho. Portanto, a conta emojify1 foi suspensa por tempo indeterminado, eu apelei essa decisão trocando diversos e-mails com o suporte do Twitter, não recebi nenhuma resposta. Tentei de tudo trazer o Emojify de volta, infelizmente, não vejo isso acontecendo. 

## O futuro
Eventualmente, pretendo transformar ele em um app desktop com o Electron e disponibilizar para download no meu site. De qualquer jeito, isso não irá ocorrer tão cedo. Portanto, caso alguém queira utilizar o Emojify, única maneira é dar clone nesse repo e rodar o arquivo 'emojify.js' localmente.
