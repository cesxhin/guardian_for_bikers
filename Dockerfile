FROM  --platform=$BUILDPLATFORM node:24-slim AS builder

WORKDIR /builder

COPY ./src/ .

RUN apt-get update &&\
    apt-get install -y libpixman-1-0 fonts-dejavu &&\
    npm i &&\
    npm run build

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=builder /builder/dist/ .

RUN npm i -g canvas

CMD ["node", "./index.js"]
