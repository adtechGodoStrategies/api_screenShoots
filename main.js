process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const puppeteer = require("puppeteer-core");
const findChrome = require("chrome-finder");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const archiver = require("archiver");

// Encuentra la ruta del ejecutable de Google Chrome en el sistema
const chromePath = findChrome();

// Array con los nombres y direcciones de las páginas a capturar
const pages = [
    { name: "as", url: "https://as.com/"},
    { name: "elpais", url: "https://elpais.com/"},
    { name: "lavanguardia", url: "https://www.lavanguardia.com/" },
    { name: "mundodeportivo", url: "https://www.mundodeportivo.com/"},
    { name: "marca", url: "https://marca.com/"},
    { name: "sport", url: "https://www.sport.es/es/" },
    { name: "elperiodico", url: "https://www.elperiodico.com/es/" },
    { name: "elmundo", url: "https://www.elmundo.es/" },
    { name: "abc", url: "https://www.abc.es/" },
    { name: "ara", url: "https://www.ara.cat/" },
    { name: "elpuntavui", url: "https://www.elpuntavui.cat/barcelona.html" },
    { name: "larazon", url: "https://www.larazon.es/" }
];

// Divide el array en dos partes
const halfLength = Math.ceil(pages.length / 2);
const firstHalf = pages.slice(0, halfLength);
const secondHalf = pages.slice(halfLength);

(async () => {
    // Lanzamos puppeter
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars']
    });

    // Obtener la ruta del directorio actual del script
    const currentDir = process.cwd();
    const currentDate = new Date();
    const datetime = currentDate.toLocaleString().replace(/[/:]/g, "-");

    // Crear la carpeta para las capturas de pantalla parte 1
    const screenshotsFolderPart1 = path.join(currentDir, "screenshots_part_1", datetime);
    fs.mkdirSync(screenshotsFolderPart1, { recursive: true });

    // Crear la carpeta para las capturas de pantalla parte 2
    const screenshotsFolderPart2 = path.join(currentDir, "screenshots_part_2", datetime);
    fs.mkdirSync(screenshotsFolderPart2, { recursive: true });

    // Iterar sobre cada página en la primera mitad del array
    await captureScreenshots(firstHalf, screenshotsFolderPart1);

    // Iterar sobre cada página en la segunda mitad del array
    await captureScreenshots(secondHalf, screenshotsFolderPart2);

    // Cerrar el navegador al final del proceso
    await browser.close();

    // Comprimir la carpeta screenshots
    const zipFilename = `screenshots_part_1_${datetime}.zip`;
    const output = fs.createWriteStream(zipFilename);

    // Comprimir la carpeta screenshots
    const zipFilename2 = `screenshots_part_2_${datetime}.zip`;
    const output2 = fs.createWriteStream(zipFilename2);

    // Guardamos el zip1
    await saveScreenshotsFolders(output,screenshotsFolderPart1);
    // Guardamos el zip2
    await saveScreenshotsFolders(output2,screenshotsFolderPart2);

    // Enviamos los emails comprimidos
    await sendEmailWhitZip()

    // Enviamos los emails después de la comprensión
    async function sendEmailWhitZip() {
        // Configura el transporter de nodemailer después de la comprensión
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'abuchgodostrategies@gmail.com', // generated ethereal user
                pass: 'jevmtixaiwtdehly', // generated ethereal password
            },
        });

        // Verifica que el transporter esté listo para enviar correos electrónicos
        transporter.verify().then(async () => {
            console.log('ready for send emails');
            // Intenta enviar el correo electrónico con el archivo comprimido como adjunto
            try {
                console.log('enviando email parte 1');
                await transporter.sendMail({
                    from: '"screnshoots" <abuchgodostrategies@gmail.com>', // sender address
                    to: "abuch@godostrategies.com,adribuch1988@gmail.com,trafico.digital@godostrategies.com,mgarciasu@godostrategies.com", // list of receivers
                    subject: "Screnshots parte 1 TEST ✔", // Subject line
                    text: "Screnshots parte 1", // plain text body
                    attachments: [{
                        filename: zipFilename,
                        path: zipFilename
                    }]
                });
            } catch (error) {
                emailStatus = error;
            }

            try {
                console.log('enviando email parte 2');
                await transporter.sendMail({
                    from: '"screnshoots" <abuchgodostrategies@gmail.com>', // sender address
                    to: "abuch@godostrategies.com,adribuch1988@gmail.com,trafico.digital@godostrategies.com,mgarciasu@godostrategies.com", // list of receivers
                    subject: "Screnshots parte 2 TEST ✔", // Subject line
                    text: "Screnshots parte 2", // plain text body
                    attachments: [{
                        filename: zipFilename2,
                        path: zipFilename2
                    }]
                });
            } catch (error) {
                emailStatus = error;
            }
            // Sale del proceso
            process.exit();
        })

    }

    // Hacemos todas las capturas de pantalla
    async function captureScreenshots(pages, screenshotsFolder) {
        for (const page of pages) {
            try {
                const pageObj = await browser.newPage();

                // Establecer el tamaño de la ventana para capturar toda la página
                await pageObj.setViewport({ width: 1920, height: 4000 });

                // Ir a la página y esperar a que se cargue el contenido principal
                await pageObj.goto(page.url);

                // Esperar 15 segundos antes de tomar la captura de pantalla
                await pageObj.waitForTimeout(5000);
                // Buscar y hacer clic en el botón de consentimiento si está presente
                if (page.name === "elpuntavui") {
                    const consentButton = await pageObj.$('[data-testid="TcfAccept"]');
                    if (consentButton) {
                        await consentButton.click();
                    }
                } else if (page.name === "larazon") {
                    const consentButton = await pageObj.$('#acceptAllMain');
                    if (consentButton) {
                        await consentButton.click();
                    }
                } else {
                    const consentButton = await pageObj.$("#didomi-notice-agree-button");
                    if (consentButton) {
                        await consentButton.click();
                    }
                }
                await pageObj.waitForTimeout(15000);

                // Tomar la captura de pantalla y guardarla en un archivo con el nombre de la página
                const screenshot = await pageObj.screenshot({
                    clip: { x: 0, y: 0, width: 1920, height: 4000 },
                });
                fs.writeFileSync(`${screenshotsFolder}/${page.name}.png`, screenshot);
                // Cerrar la página actual antes de pasar a la siguiente
                await pageObj.close();
            } catch (err) {
                // Registrar el error en el archivo de log
                const errorLogPath = path.join(screenshotsFolder, "error.log");
                fs.appendFileSync(errorLogPath, `${page.name}: ${err}\n`);
                console.log(`Error al capturar ${page.name}: ${err}`);
            }
        }
    }

    // Guardamos los zipz con su nombre y fecha
    async function saveScreenshotsFolders(output,file) {
        const archive = archiver("zip", { zip64: { level: 9 } });
        // Empieza a escribir en el archivo comprimido 
        archive.pipe(output);
        // Añade la carpeta screenshots al archivo comprimido
        archive.directory(file, false);
        // Finaliza la escritura del archivo comprimido
        archive.finalize();

        // Si ocurre un error en la compresión, muestra un mensaje de error
        archive.on("error", (err) => {
            console.error(`Error al comprimir la carpeta screenshots_part_1: ${err}`);
        });
    }
})();