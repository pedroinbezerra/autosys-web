# Dockerfile

# base image
FROM node:alpine

RUN apk add bash

# create & set working directory
RUN mkdir -p /usr/src
WORKDIR /usr/src

# copy source files
COPY . /usr/src

# install dependencies
RUN npm install
RUN  npm i --save-dev @types/validatorjs

ENV NEXT_TELEMETRY_DISABLED 1

# start app
RUN npm run build
EXPOSE 3000
CMD npm run start