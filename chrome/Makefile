help:
	@echo "Available targets:"
	@echo "install                 install all dependencies"
	@echo "admin                   compile all admin files"
	@echo "compile                 compile all coffee files"
	@echo "build                   compile all files"

admin:
	tsc --out src/admin.js \
		src/admin/main.ts \
		src/admin/articles/private_key_generate.ts \
		src/admin/articles/private_key_import.ts \
		src/admin/articles/private_key_remove.ts \
		src/admin/articles/private_key_view.ts \
		src/admin/articles/public_key_import.ts \
		src/admin/articles/public_key_list.ts \
		src/admin/run.ts

compile:
	coffee -c ./ unittests/

build: admin compile

install:
	bower install
	tsd install
