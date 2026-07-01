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
  ];
  for (const cliente of clientes) {
    await raizUsuario.collection('clientes').doc(cliente.id).set(cliente, { merge: true });
  }

  const hoje = new Date().toLocaleDateString('pt-BR');
  const ordens = [
    {
      id: 'demo-os-1', cliente: clientes[0].nome, clienteTelefone: clientes[0].telefone,
      motor: 'Motor Volvo Penta D13', posicao: 'BB', tipoManutencao: 'Preventiva',
      descricao: 'Troca de óleo e filtros programada.', status: 'Aberta', dataCriacao: hoje,
    },
    {
      id: 'demo-os-2', cliente: clientes[1].nome, clienteTelefone: clientes[1].telefone,
      motor: 'Gerador Cummins 150kVA', posicao: 'Ré', tipoManutencao: 'Corretiva',
      descricao: 'Ruído anormal no motor durante a partida.', status: 'Em Andamento', dataCriacao: hoje,
    },
    {
      id: 'demo-os-3', cliente: clientes[0].nome, clienteTelefone: clientes[0].telefone,
      motor: 'Bomba hidráulica principal', posicao: 'Vante', tipoManutencao: 'Revisão',
      descricao: 'Revisão geral concluída com troca de vedações.', status: 'Concluída', dataCriacao: hoje,
    },
  ];
  for (const os of ordens) {
    await raizUsuario.collection('ordensServico').doc(os.id).set(os, { merge: true });
  }

  console.log(`Dados de demonstração criados para ${EMAIL_DEMO} (uid: ${uid}).`);
  if (!process.env.DEMO_PASSWORD) {
    console.log(`Senha padrão usada: ${SENHA_DEMO} (defina DEMO_PASSWORD para customizar).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
