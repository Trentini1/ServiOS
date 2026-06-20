import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { OrdemServico } from '../screens/OSListScreen';

type Empresa = {
  nome: string;
  cnpj: string;
  telefone: string;
  segmento: string;
  cidade: string;
  estado: string;
};

function blocoAssinatura(titulo: string, imagemBase64?: string) {
  if (imagemBase64) {
    return `
      <div class="assinatura-box">
        <img src="${imagemBase64}" class="assinatura-img" />
        <div class="assinatura-linha"></div>
        <div class="assinatura-titulo">${titulo}</div>
      </div>
    `;
  }
  return `
    <div class="assinatura-box">
      <div class="assinatura-vazia"></div>
      <div class="assinatura-linha"></div>
      <div class="assinatura-titulo">${titulo}</div>
    </div>
  `;
}

function montarHTML(ordem: OrdemServico, empresa: Empresa) {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; font-family: -apple-system, Helvetica, Arial, sans-serif; }
          body { padding: 32px; color: #1e293b; }
          .cabecalho {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .empresa-nome { font-size: 20px; font-weight: 700; color: #0b1220; }
          .empresa-info { font-size: 11px; color: #64748b; margin-top: 4px; }
          .doc-titulo { font-size: 14px; font-weight: 700; color: #2563eb; text-align: right; }
          .doc-data { font-size: 11px; color: #64748b; text-align: right; margin-top: 4px; }
          .secao { margin-bottom: 20px; }
          .secao-titulo {
            font-size: 11px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .grid { display: flex; flex-wrap: wrap; gap: 16px; }
          .campo { min-width: 150px; }
          .campo-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; }
          .campo-valor { font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px; }
          .descricao-texto { font-size: 13px; color: #334155; line-height: 1.5; }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            background-color: #2563eb22;
            color: #2563eb;
          }
          .assinaturas { display: flex; gap: 24px; margin-top: 40px; }
          .assinatura-box { flex: 1; text-align: center; }
          .assinatura-img { max-height: 70px; max-width: 100%; }
          .assinatura-vazia { height: 70px; }
          .assinatura-linha { border-top: 1px solid #94a3b8; margin-top: 8px; }
          .assinatura-titulo { font-size: 11px; color: #64748b; margin-top: 6px; }
          .rodape { margin-top: 40px; font-size: 9px; color: #cbd5e1; text-align: center; }
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <div>
            <div class="empresa-nome">${empresa.nome}</div>
            <div class="empresa-info">CNPJ: ${empresa.cnpj}</div>
            <div class="empresa-info">${empresa.cidade}/${empresa.estado} • ${empresa.telefone}</div>
          </div>
          <div>
            <div class="doc-titulo">ORDEM DE SERVIÇO</div>
            <div class="doc-data">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div class="secao">
          <div class="secao-titulo">Cliente</div>
          <div class="campo-valor" style="font-size: 16px;">${ordem.cliente}</div>
        </div>

        <div class="secao">
          <div class="secao-titulo">Informações Técnicas</div>
          <div class="grid">
            <div class="campo">
              <div class="campo-label">Motor / Equipamento</div>
              <div class="campo-valor">${ordem.motor}</div>
            </div>
            <div class="campo">
              <div class="campo-label">Posição</div>
              <div class="campo-valor">${ordem.posicao}</div>
            </div>
            <div class="campo">
              <div class="campo-label">Tipo de Manutenção</div>
              <div class="campo-valor">${ordem.tipoManutencao}</div>
            </div>
            <div class="campo">
              <div class="campo-label">Status</div>
              <div class="campo-valor"><span class="status-badge">${ordem.status}</span></div>
            </div>
            <div class="campo">
              <div class="campo-label">Data de Criação</div>
              <div class="campo-valor">${ordem.dataCriacao}</div>
            </div>
          </div>
        </div>

        ${
          ordem.descricao
            ? `
        <div class="secao">
          <div class="secao-titulo">Descrição do Serviço</div>
          <div class="descricao-texto">${ordem.descricao}</div>
        </div>`
            : ''
        }

        <div class="assinaturas">
          ${blocoAssinatura('Assinatura do Técnico', ordem.assinaturaTecnico)}
          ${blocoAssinatura('Assinatura do Cliente', ordem.assinaturaCliente)}
        </div>

        <div class="rodape">Documento gerado pelo ServiOS • ${empresa.nome}</div>
      </body>
    </html>
  `;
}

export async function gerarESalvarPdfOS(ordem: OrdemServico, empresa: Empresa) {
  const html = montarHTML(ordem, empresa);
  const { uri } = await Print.printToFileAsync({ html });

  const disponivel = await Sharing.isAvailableAsync();
  if (disponivel) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `OS - ${ordem.cliente}`,
      UTI: 'com.adobe.pdf',
    });
  }
}