exec:
	docker compose exec back-talkmaster bash

pint:
	docker compose exec back-talkmaster ./vendor/bin/pint

migrate:
	docker compose exec back-talkmaster php artisan migrate

install:
	docker compose exec back-talkmaster composer install

clear: 
	docker compose exec back-talkmaster php artisan config:clear

test:
	docker compose exec back-talkmaster ./vendor/bin/phpunit

larastan:
	docker compose exec back-talkmaster ./vendor/bin/phpstan analyse --memory-limit=4G
