FROM node:24-alpine

WORKDIR /app

COPY ./src/dist .

CMD ["node", "./main.mjs"]