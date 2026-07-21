/**
 * Popula dados de demonstração para o usuário demo@tecnoos.com no Firestore.
 *
 * Uso:
 *   1. No Firebase Console: Configurações do projeto > Contas de serviço >
 *      Gerar nova chave privada. Salve o JSON fora do repositório.
 *   2. Defina a variável de ambiente apontando para o arquivo baixado:
 *        set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\serviceAccountKey.json   (PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS=...)
 *   3. Rode: node scripts/seedDemoData.js
 *
 * Nunca commite o arquivo de credenciais da conta de serviço.
 */

const admin = require('firebase-admin');

const EMAIL_DEMO = 'demo@tecnoos.com';
const SENHA_DEMO = process.env.DEMO_PASSWORD || 'Demo@12345';

admin.initializeApp({ credential: admin.credential.applicationDefault() });

async function obterOuCriarUsuarioDemo() {
  try {
    return await admin.auth().getUserByEmail(EMAIL_DEMO);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    return admin.auth().createUser({
      email: EMAIL_DEMO,
      password: SENHA_DEMO,
      displayName: 'Usuário Demo',
    });
  }
}

async function main() {
  const usuario = await obterOuCriarUsuarioDemo();
  const uid = usuario.uid;
  const db = admin.firestore();
  const raizUsuario = db.collection('users').doc(uid);

  const empresa = {
    nome: 'Empresa Demo Ltda',
    cnpj: '00.000.000/0001-00',
    telefone: '(41) 99999-0000',
    segmento: 'Manutenção Industrial',
    cidade: 'Curitiba',
    estado: 'PR',
  };
  await raizUsuario.collection('empresa').doc('dados').set(empresa, { merge: true });

  const clientes = [
    { id: 'demo-cliente-1', nome: 'Porto Sul Transportes', cnpjCpf: '12.345.678/0001-90', telefone: '(41) 3333-1122', cidade: 'Curitiba', estado: 'PR' },
    { id: 'demo-cliente-2', nome: 'João da Silva', cnpjCpf: '123.456.789-00', telefone: '(41) 98888-2233', cidade: 'Curitiba', estado: 'PR' },
    { id: 'demo-cliente-3', nome: 'Naval Sul Engenharia', cnpjCpf: '23.456.789/0001-11', telefone: '(41) 3322-4455', cidade: 'Paranaguá', estado: 'PR' },
    { id: 'demo-cliente-4', nome: 'Maria Oliveira', cnpjCpf: '234.567.890-11', telefone: '(41) 97777-3344', cidade: 'Curitiba', estado: 'PR' },
    { id: 'demo-cliente-5', nome: 'Transportadora Litoral', cnpjCpf: '34.567.890/0001-22', telefone: '(41) 3344-5566', cidade: 'Antonina', estado: 'PR' },
  ];
  for (const cliente of clientes) {
    await raizUsuario.collection('clientes').doc(cliente.id).set(cliente, { merge: true });
  }

  const hoje = new Date().toLocaleDateString('pt-BR');
  const motores = [
    'Motor Volvo Penta D13', 'Gerador Cummins 150kVA', 'Bomba hidráulica principal',
    'Motor MAN D2676', 'Compressor de ar Atlas Copco', 'Gerador Perkins 100kVA',
    'Motor Scania DC13', 'Bomba de porão', 'Motor Caterpillar C18', 'Guincho hidráulico',
  ];
  const tipos = ['Preventiva', 'Corretiva', 'Revisão'];
  const posicoes = ['BB', 'Ré', 'Vante', 'Boreste', 'Convés'];
  const ordens = Array.from({ length: 10 }, (_, i) => {
    const cliente = clientes[i % clientes.length];
    return {
      id: `demo-os-${i + 1}`, cliente: cliente.nome, clienteTelefone: cliente.telefone,
      motor: motores[i], posicao: posicoes[i % posicoes.length], tipoManutencao: tipos[i % tipos.length],
      descricao: 'Ordem de serviço em aberto aguardando execução.', status: 'Aberta', dataCriacao: hoje,
    };
  });
  for (const os of ordens) {
    await raizUsuario.collection('ordensServico').doc(os.id).set(os, { merge: true });
  }

  // Simula assinatura expirada (trial já usado, não assinante) para review da Apple
  // poder testar o fluxo de compra a partir do Paywall.
  const TRIAL_EXPIRADO_HA_DIAS = 30;
  await raizUsuario.collection('assinatura').doc('dados').set({
    assinante: false,
    trialIniciadoEm: Date.now() - TRIAL_EXPIRADO_HA_DIAS * 24 * 60 * 60 * 1000,
    expiraEm: null,
    atualizadoEm: Date.now(),
  }, { merge: true });

  console.log(`Dados de demonstração criados para ${EMAIL_DEMO} (uid: ${uid}).`);
  console.log('Assinatura marcada como expirada (trial já usado) para testar o Paywall/compra na review da Apple.');
  if (!process.env.DEMO_PASSWORD) {
    console.log(`Senha padrão usada: ${SENHA_DEMO} (defina DEMO_PASSWORD para customizar).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
