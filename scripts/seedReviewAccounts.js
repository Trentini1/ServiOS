/**
 * Cria duas contas para a review da Apple testarem os dois estados de assinatura:
 *   1. revisao.expirado@tecnoos.com — sem trial ativo e sem assinatura (Paywall bloqueia o app).
 *   2. revisao.trial@tecnoos.com    — dentro do teste grátis de 7 dias (app liberado, sem cobrança).
 *
 * Uso:
 *   1. No Firebase Console: Configurações do projeto > Contas de serviço >
 *      Gerar nova chave privada. Salve o JSON fora do repositório.
 *   2. Defina a variável de ambiente apontando para o arquivo baixado:
 *        set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\serviceAccountKey.json   (PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS=...)
 *   3. Rode: node scripts/seedReviewAccounts.js
 *
 * Nunca commite o arquivo de credenciais da conta de serviço.
 */

const admin = require('firebase-admin');

const SENHA_REVISAO = process.env.REVIEW_PASSWORD || 'Revisao@2026';

admin.initializeApp({ credential: admin.credential.applicationDefault() });

async function obterOuCriarUsuario(email, displayName) {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    return admin.auth().createUser({ email, password: SENHA_REVISAO, displayName });
  }
}

async function configurarEmpresaEClientes(raizUsuario, sufixo) {
  const empresa = {
    nome: `Empresa Revisão ${sufixo} Ltda`,
    cnpj: '00.000.000/0001-00',
    telefone: '(41) 99999-0000',
    segmento: 'Manutenção Industrial',
    cidade: 'Curitiba',
    estado: 'PR',
  };
  await raizUsuario.collection('empresa').doc('dados').set(empresa, { merge: true });

  const cliente = {
    id: 'revisao-cliente-1', nome: 'Porto Sul Transportes', cnpjCpf: '12.345.678/0001-90',
    telefone: '(41) 3333-1122', cidade: 'Curitiba', estado: 'PR',
  };
  await raizUsuario.collection('clientes').doc(cliente.id).set(cliente, { merge: true });
}

async function criarContaExpirada(db) {
  const usuario = await obterOuCriarUsuario('revisao.expirado@tecnoos.com', 'Revisão Apple (expirado)');
  const uid = usuario.uid;
  const raizUsuario = db.collection('users').doc(uid);

  await configurarEmpresaEClientes(raizUsuario, 'Expirado');

  const TRIAL_EXPIRADO_HA_DIAS = 30;
  await raizUsuario.collection('assinatura').doc('dados').set({
    assinante: false,
    trialIniciadoEm: Date.now() - TRIAL_EXPIRADO_HA_DIAS * 24 * 60 * 60 * 1000,
    expiraEm: null,
    atualizadoEm: Date.now(),
  }, { merge: true });

  console.log(`revisao.expirado@tecnoos.com criada (uid: ${uid}) — trial expirado, sem assinatura, Paywall deve bloquear o app.`);
}

async function criarContaTrialAtivo(db) {
  const usuario = await obterOuCriarUsuario('revisao.trial@tecnoos.com', 'Revisão Apple (trial ativo)');
  const uid = usuario.uid;
  const raizUsuario = db.collection('users').doc(uid);

  await configurarEmpresaEClientes(raizUsuario, 'Trial');

  await raizUsuario.collection('assinatura').doc('dados').set({
    assinante: false,
    trialIniciadoEm: Date.now(),
    expiraEm: null,
    atualizadoEm: Date.now(),
  }, { merge: true });

  console.log(`revisao.trial@tecnoos.com criada (uid: ${uid}) — teste grátis de 7 dias recém-iniciado, app deve ficar liberado.`);
}

async function main() {
  const db = admin.firestore();
  await criarContaExpirada(db);
  await criarContaTrialAtivo(db);
  console.log(`Senha das duas contas: ${SENHA_REVISAO} (defina REVIEW_PASSWORD para customizar).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
