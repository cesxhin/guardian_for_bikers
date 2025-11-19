FROM node:24-slim AS builder

WORKDIR /builder

COPY ./src/ .

RUN npm i &&\
    npm run build

FROM node:24-slim AS rebuilder

WORKDIR /rebuilder

COPY --from=builder /builder/dist/ .

RUN  apt-get update &&\
    apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev &&\
    npm i --prefix . --no-package-lock --build-from-source canvas

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=rebuilder /rebuilder/ .

RUN apt-get update &&\
    apt-get install -y libgif-dev librsvg2-dev libpixman-1-0 fonts-dejavu

CMD ["node", "./index.js"]
