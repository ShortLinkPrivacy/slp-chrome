
help:
	@echo "Available targets:"
	@echo "-----------------------------------------------------"
	@echo "install                 install all dependencies"
	@echo "clean                   delete all generated Js files"
	@echo "modules                 compile all module files"
	@echo "tests                   compile all unit test files"
	@echo "admin                   compile all admin files"
	@echo "browser                 compile all browser files"
	@echo "content                 compile all content files"
	@echo "background              compile all background files"
	@echo "less                    compile all less files"
	@echo "build                   build all"
	@echo "dist                    make a distribution"
	@echo "dist-clean              cleanup the distribution"
	@echo "build-dist              build and make dist"

#------------------------------------------------------------------

install:
	bower install
	tsd install

#------------------------------------------------------------------

clean:
	find src -name "*.js" | xargs rm -v
	rm -v src/modules.d.ts

#------------------------------------------------------------------

# TODO: add a header file
modules:
	tsc --out src/modules.js --declaration \
		src/modules/typings.ts \
		src/modules/util.ts \
		src/modules/config.ts \
		src/modules/interfaces.ts \
		src/modules/keys.ts \
		src/modules/keysource.ts \
		src/modules/messages.ts \
		src/modules/storage.ts \
		src/modules/preferences.ts \
		src/modules/url.ts \
		src/modules/api.ts \
		src/modules/application.ts \
		src/modules/storage/AddressBook/IndexedDB.ts \
		src/modules/storage/AddressBook.ts \
		src/modules/storage/PrivateKey/Local.ts \
		src/modules/storage/PrivateKey.ts
	tsc --out src/modlite.js \
		src/modules/typings.ts \
		src/modules/util.ts \
		src/modules/url.ts


#------------------------------------------------------------------

tests:
	tsc -p unittests

admin:
	tsc --out src/admin.js \
		src/admin/main.ts \
		src/admin/articles/private_key_generate.ts \
		src/admin/articles/private_key_import.ts \
		src/admin/articles/private_key_remove.ts \
		src/admin/articles/private_key_view.ts \
		src/admin/articles/public_key_import.ts \
		src/admin/articles/public_key_list.ts \
		src/admin/articles/preferences.ts

browser:
	tsc --out src/browser.js src/browser.ts

content:
	tsc --out src/content.js src/content.ts

background:
	tsc --out src/background.js src/background.ts

less:
	lessc css/browser.less css/browser.css
	lessc css/content.less css/content.css
	lessc css/admin.less css/admin.css

build: modules tests admin browser content background less

dist:
	bin/build

dist-clean:
	rm -rfv dist
	rm -v ShortLinkPrivacy-*.zip

build-dist: dist-clean build dist
