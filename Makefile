# Výchozí cíl, pokud se make spustí bez parametrů
all: help

# Cíl pro instalaci potřebných nástrojů
install:
	# Sem přidejte příkazy pro instalaci potřebných nástrojů
	sudo apt install sed uglifyjs yui-compressor sed optipng gifsicle

# Cíl pro minifikaci všech souborů
dist: copy-to-dist minify-css minify-js minify-html minify-gif minify-png

copy-to-dist:
	find dist -maxdepth 1 -type f -delete
	cp src/* dist

# Cíl pro minifikaci JavaScript souborů
minify-js:
	cd src && find -type f -name "*.js" -exec uglifyjs {} -o ../dist/{} \; && cd ..

# Cíl pro minifikaci CSS souborů
minify-css:
	find src -type f -name "*.css" -exec bash -c 'yui-compressor {} > dist/`basename {}`' \;

# Cíl pro minifikaci a kopírování HTML souborů
minify-html:
	find dist -type f -name "*.html" -exec bash -c 'sed -i -e "/^\s*$$/d; s/^[[:space:]]\+//" {}' \;

minify-png:
	optipng -quiet -o7 dist/*.png

minify-gif:
	cd src && find -type f -name "*.gif" -exec bash -c 'gifsicle -o ../dist/$(basename {}) {}' \; && cd ..


deploy:
	git push origin :gh-pages && git subtree push --prefix dist origin gh-pages

deploy.init:
	git subtree push --prefix dist origin gh-pages


# Cíl pro zobrazení nápovědy
help:
	@echo "Použití:"
	@echo "  make install     - Nainstaluje potřebné nástroje"
	@echo "  make dist        - Sestaví soubory pro nasazeni (do slozky dist)"
	@echo "  make deploy      - Nasadí web (ze slozky dist) na GitHub Pages"
	@echo "  make deploy.init - Inicializuje gh-deploy a nasadi web na GitHub Pages"
	@echo "  make help        - Vypíše tuto nápovědu"

