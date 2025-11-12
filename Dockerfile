FROM node:24-slim AS builder

WORKDIR /builder

COPY ./src/ .

RUN apt-get update &&\
    apt-get install -y build-essential pkg-config librsvg2-dev libcairo2-dev libpango1.0-dev &&\
    npm i &&\
    ./node_modules/.bin/node-gyp rebuild --release -C ./node_modules/canvas &&\
    npm run build

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=builder /builder/dist/ .

RUN apt-get update && apt-get install -y libpixman-1-0 fonts-dejavu

CMD ["node", "./index.js"]
