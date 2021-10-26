FROM node:14-alpine as build-stage

WORKDIR /app

COPY . /app

RUN apk add git 

RUN npm i 
EXPOSE 3002
CMD ["npm", "start"]
