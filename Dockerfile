FROM node:10

RUN mkdir /src
WORKDIR /src
COPY . /src
RUN npm i
CMD ["node", "main.js"]