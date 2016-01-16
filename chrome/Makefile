help:
	@echo "Available targets:"
	@echo "-----------------------------------------------------"
	@echo "install                 install all dependencies"
	@echo "clean                   delete all generated Js files"
	@echo "modules                 compile all module files"
	@echo "coffee                  compile all coffee files"
	@echo "admin                   compile all admin files"
	@echo "browser                 compile all browser files"
	@echo "content                 compile all content files"
	@echo "background              compile all background files"
	@echo "less                    compile all less files"
	@echo "build                   build all"

#------------------------------------------------------------------

install:
	bower install
	tsd install

#------------------------------------------------------------------

clean:
	find src -name "*.js" | xargs rm -v
	rm -v src/modules.d.ts

#------------------------------------------------------------------

modules:
	find src/modules -name "*.ts" | xargs tsc --out src/modules.js --declaration

#------------------------------------------------------------------

coffee:
	coffee -c ./ unittests/

admin:
	tsc --out src/admin.js \
		src/admin/main.ts \
		src/admin/articles/private_key_generate.ts \
		src/admin/articles/private_key_import.ts \
		src/admin/articles/private_key_remove.ts \
		src/admin/articles/private_key_view.ts \
		src/admin/articles/public_key_import.ts \
		src/admin/articles/public_key_list.ts

browser:
	tsc --out src/browser.js src/browser.ts

content:
	tsc --out src/content.js src/content.ts

background:
	tsc --out src/background.js src/background.ts

less:
	lessc css/browser.less css/browser.css
	lessc css/content.less css/content.css

build: modules coffee admin browser content background less

