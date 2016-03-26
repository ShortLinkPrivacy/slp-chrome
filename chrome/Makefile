COMPRESS=java -jar yuicompressor-2.4.8.jar
VERSION=$(shell cat manifest.json | perl -MJSON -E 'my @a=<>;print from_json(join("",@a))->{version}')
UNAME=$(shell uname)

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
		src/modules/url.ts


#------------------------------------------------------------------

tests:
	find ./unittests -name "*.ts" -print -exec tsc {} \;

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
	mkdir -pv dist/{src,css,fonts,lib}
	$(COMPRESS) src/browser.js -o dist/src/browser.js
	$(COMPRESS) src/background.js -o dist/src/background.js
	$(COMPRESS) src/content.js -o dist/src/content.js
	$(COMPRESS) src/admin.js -o dist/src/admin.js
	$(COMPRESS) src/modules.js -o dist/src/modules.js
	$(COMPRESS) src/modlite.js -o dist/src/modlite.js
	cp css/*.css dist/css
	cp -r src/templates dist/src
	cp -r fonts dist
	cp -r images dist
	cp -r _locales dist
	cp ../ShortLinkPrivacy.pem dist/key.pem
	cat browser.html | sed 's/\.\/bower_components\///' | sed 's/rivets\/dist/lib/' | sed 's/openpgp\/dist/lib/' | sed 's/pathjs/lib/' > dist/browser.html
	cat manifest.json | sed 's/bower_components\/openpgp\/dist/lib/' > dist/manifest.json
	cp bower_components/pathjs/path.min.js dist/lib
	cp bower_components/rivets/dist/rivets.bundled.min.js dist/lib
	cp bower_components/openpgp/dist/openpgp.min.js dist/lib
	zip -r ShortLinkPrivacy-$(VERSION).zip dist/*
	echo "Produced ShortLinkPrivacy-$(VERSION).zip"

dist-clean:
	rm -rfv dist

build-dist: dist-clean build dist
