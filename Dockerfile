FROM --platform=$BUILDPLATFORM node:24-slim AS builder

WORKDIR /builder

COPY ./src/ .

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

RUN npm i && npm rebuild canvas --build-from-source && npm run build

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=builder /builder/dist/ .

RUN apt-get update && apt-get install -y libpixman-1-0 fonts-dejavu

CMD ["node", "./main.mjs"]