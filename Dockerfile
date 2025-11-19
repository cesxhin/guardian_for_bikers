FROM node:24-slim AS builder

WORKDIR /builder

COPY ./src/ .

RUN npm i &&\
    npm run build

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=builder /builder/dist/ .

RUN apt-get update &&\
    apt-get install -y libpixman-1-0 fonts-dejavu

RUN ARCH=$(dpkg --print-architecture) && if [ "$ARCH" = "arm64" ]; then\
        apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev; \
    fi

CMD ["node", "./index.js"]