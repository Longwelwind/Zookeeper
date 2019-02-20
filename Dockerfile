FROM node as node

WORKDIR /usr/src/app

COPY . .

RUN npm install
# Using newer versions of typescript yields errors.
# This version also yields errors, but nothing
# that prevents the game from running.
RUN npm install -g typescript@1.6.2
# tsc yields errors, but not breaking ones, so "|| true"
# is there to still allow docker to build the image even
# if the return code is != 0.
RUN tsc || true
RUN ls

FROM halverneus/static-file-server

COPY --from=node /usr/src/app /web