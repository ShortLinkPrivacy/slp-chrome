help:
	@echo "Available targets:"
	@echo "install                 install all dependencies"
	@echo "admin                   compile all admin files"

admin:
	tsc --out src/admin.js \
		src/admin/main.ts \
		src/admin/articles/private_key_generate.ts \
		src/admin/articles/private_key_import.ts \
		src/admin/articles/private_key_remove.ts \
		src/admin/articles/private_key_view.ts \
		src/admin/articles/public_key_import.ts \
		src/admin/run.ts

install:
	bower install
	tsd install
