FROM node:24-alpine

WORKDIR /app

COPY ./src ./src

RUN (cd ./src && npm i && npm run build && mv ./dist ../) && rm -rf ./src

CMD ["node", "./dist/main.mjs"]