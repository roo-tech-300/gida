FROM node:24-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src

# Docker seeds a new named volume from the image folder it mounts over,
# owner included, so the node user can write to the media volume.
RUN mkdir -p /srv/media && chown node:node /srv/media

ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "src/index.ts"]
