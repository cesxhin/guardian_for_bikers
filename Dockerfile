FROM node:24-slim

WORKDIR /app

COPY ./src/dist .

RUN apt-get update && apt-get install -y libpixman-1-0 fonts-dejavu

CMD ["node", "./main.mjs"]