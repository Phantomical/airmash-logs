FROM alpine:latest

RUN apk add --update lighttpd

EXPOSE 80

ADD lighttpd.conf /var/lighttpd.conf
ADD build/html /var/www/html

RUN lighttpd -t -f /var/lighttpd.conf

ENTRYPOINT ["lighttpd", "-D", "-f", "/var/lighttpd.conf"]