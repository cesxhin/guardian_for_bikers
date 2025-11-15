FROM  --platform=$BUILDPLATFORM node:24-slim AS builder

WORKDIR /builder

COPY ./src/ .

RUN npm i &&\
    npm run build

FROM  node:24-slim AS rebuilder

WORKDIR /rebuilder

COPY --from=builder /builder/dist/ .

RUN npm i --prefix . --no-package-lock --ignore-scripts canvas

RUN ARCH=$(dpkg --print-architecture) && if [ "$ARCH" = "arm64" ]; then\
        apt-get update &&\
        apt-get install -y build-essential pkg-config librsvg2-dev libcairo2-dev libpango1.0-dev &&\
        npm i --prefix . --no-package-lock --ignore-scripts node-gyp &&\
        ./node_modules/.bin/node-gyp rebuild --release -C ./node_modules/canvas &&\
        npm uni node-gyp; \
    fi

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=rebuilder /rebuilder/ .

RUN apt-get update &&\
    apt-get install -y libpixman-1-0 fonts-dejavu

CMD ["node", "./index.js"]