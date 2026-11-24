
const readline = require("readline");
const dns = require("dns").promises;
const https = require("https");
const os = require("os");
const fs = require("fs");

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(texto) {
    return new Promise(resolve => {
        terminal.question(texto, resolve);
    });
}

function testarConexao(url) {
    return new Promise(resolve => {
        const inicio = Date.now();

        const requisicao = https.get(url, resposta => {
            const tempo = Date.now() - inicio;

            resposta.resume();

            resolve({
                conectado: true,
                status: resposta.statusCode,
                tempo
            });
        });

        requisicao.setTimeout(5000, () => {
            requisicao.destroy();
            resolve({ conectado: false });
        });

        requisicao.on("error", () => {
            resolve({ conectado: false });
        });
    });
}

async function analisarRede() {
    console.log("\n========== NETGUARD ==========");
    console.log("       DIAGNÓSTICO DE REDE");
    console.log("==============================\n");

    const dominio = await perguntar(
        "Digite um domínio (ex: google.com): "
    );

    const resultados = [];

    console.log("\n[1] Consultando DNS...");

    try {
        const ips = await dns.resolve4(dominio);

        console.log("IP encontrado:", ips.join(", "));

        resultados.push("IP: " + ips.join(", "));
    } catch (erro) {
        console.log("Não foi possível consultar o DNS.");

        resultados.push("Falha na consulta DNS");
    }

    console.log("\n[2] Testando conexão HTTPS...");

    const resultado = await testarConexao(
        "https://" + dominio
    );

    if (resultado.conectado) {
        console.log("Status HTTP:", resultado.status);
        console.log("Tempo de resposta:", resultado.tempo + " ms");

        resultados.push("Status HTTP: " + resultado.status);
        resultados.push("Tempo: " + resultado.tempo + " ms");
    } else {
        console.log("Não foi possível estabelecer conexão.");

        resultados.push("Falha na conexão HTTPS");
    }

    console.log("\n[3] Informações do computador...");

    console.log("Sistema:", os.type());
    console.log("Plataforma:", os.platform());
    console.log("Arquitetura:", os.arch());

    console.log("\n========== RESULTADO ==========");

    resultados.forEach(item => console.log(item));

    if (!fs.existsSync("reports")) {
        fs.mkdirSync("reports");
    }

    const relatorio = `
NETGUARD - RELATÓRIO DE REDE
Data: ${new Date().toLocaleString("pt-BR")}
Domínio: ${dominio}

${resultados.join("\n")}
`;

    fs.writeFileSync(
        "reports/relatorio.txt",
        relatorio
    );

    console.log("\nRelatório salvo em reports/relatorio.txt");

    console.log("\n========== FINALIZADO ==========");

    terminal.close();
}

analisarRede();
