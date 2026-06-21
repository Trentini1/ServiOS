import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { OrdemServico, DiaExecucao, PecaUtilizada } from '../screens/OSListScreen';
import type { PdfTema } from './temas';
import { PDF_TEMA_PADRAO } from './temas';

type Empresa = {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  segmento?: string;
};

function isoParaBR(iso: string) {
  return iso.split('-').reverse().join('/');
}

function calcularTotalDia(dia: DiaExecucao): string {
  let totalMin = 0;
  for (const p of dia.periodos) {
    const [eh, em] = p.entrada.split(':').map(Number);
    const [sh, sm] = p.saida.split(':').map(Number);
    if (!isNaN(eh) && !isNaN(em) && !isNaN(sh) && !isNaN(sm)) {
      const diff = sh * 60 + sm - (eh * 60 + em);
      if (diff > 0) totalMin += diff;
    }
  }
  if (!totalMin) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m > 0 ? `${m.toString().padStart(2, '0')}min` : ''}`;
}

function calcularTotalGeral(dias: DiaExecucao[]): string {
  let totalMin = 0;
  for (const dia of dias) {
    for (const p of dia.periodos) {
      const [eh, em] = p.entrada.split(':').map(Number);
      const [sh, sm] = p.saida.split(':').map(Number);
      if (!isNaN(eh) && !isNaN(em) && !isNaN(sh) && !isNaN(sm)) {
        const diff = sh * 60 + sm - (eh * 60 + em);
        if (diff > 0) totalMin += diff;
      }
    }
  }
  if (!totalMin) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m > 0 ? `${m.toString().padStart(2, '0')}min` : ''}`;
}

function blocoAssinatura(titulo: string, imagemBase64?: string) {
  if (imagemBase64) {
    return `
      <div class="assinatura-box">
        <img src="${imagemBase64}" class="assinatura-img" />
        <div class="assinatura-linha"></div>
        <div class="assinatura-titulo">${titulo}</div>
      </div>`;
  }
  return `
    <div class="assinatura-box">
      <div class="assinatura-vazia"></div>
      <div class="assinatura-linha"></div>
      <div class="assinatura-titulo">${titulo}</div>
    </div>`;
}

function secaoPeriodos(dias: DiaExecucao[], cor: string): string {
  if (!dias || dias.length === 0) return '';
  const totalGeral = calcularTotalGeral(dias);
  const diasOrdenados = [...dias].sort((a, b) => a.data.localeCompare(b.data));
  const linhas = diasOrdenados.map((dia) => {
    const total = calcularTotalDia(dia);
    const periodosTexto = dia.periodos
      .filter((p) => p.entrada && p.saida)
      .map((p) => `${p.entrada} → ${p.saida}`)
      .join('&nbsp;&nbsp;|&nbsp;&nbsp;');
    return `
      <tr>
        <td>${isoParaBR(dia.data)}</td>
        <td>${periodosTexto || '—'}</td>
        <td style="text-align:center; font-weight:700; color:${cor};">${total}</td>
      </tr>`;
  }).join('');

  return `
    <div class="secao">
      <div class="secao-titulo">Períodos de Execução</div>
      <table class="tabela">
        <thead><tr><th>Data</th><th>Períodos</th><th>Total</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
      ${totalGeral ? `<div class="total-geral" style="color:${cor};">Total geral: <strong>${totalGeral}</strong></div>` : ''}
    </div>`;
}

function secaoPecas(pecas: PecaUtilizada[], estilo: PdfTema['estiloTabela']): string {
  if (!pecas || pecas.length === 0) return '';
  const linhas = pecas.map((p, i) => `
    <tr${estilo === 'listrado' && i % 2 === 0 ? ' class="listrado"' : ''}>
      <td>${p.descricao}</td>
      <td style="text-align:center;">${p.quantidade} ${p.unidade}</td>
      <td>${p.fornecedor || '—'}</td>
    </tr>`).join('');

  return `
    <div class="secao">
      <div class="secao-titulo">Peças Utilizadas</div>
      <table class="tabela">
        <thead><tr><th>Descrição</th><th>Quantidade</th><th>Fornecedor</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

function secaoFotos(fotos: string[]): string {
  if (!fotos || fotos.length === 0) return '';
  const imgs = fotos.map((f) => `<img src="${f}" class="foto-thumb" />`).join('');
  return `
    <div class="secao">
      <div class="secao-titulo">Registro Fotográfico (${fotos.length} foto${fotos.length > 1 ? 's' : ''})</div>
      <div class="fotos-grid">${imgs}</div>
    </div>`;
}

function cssParaTema(pdfTema: PdfTema): string {
  const { corHeader, corAcento, corTextoHeader, corSecao, estiloTabela } = pdfTema;
  const thBase: Record<PdfTema['estiloTabela'], string> = {
    moderno: `background:${corAcento}22; color:${corAcento};`,
    listrado: 'background:#f8fafc; color:#475569;',
    minimal: 'background:transparent; color:#374151; border-bottom:2px solid #e2e8f0;',
    elegante: `background:#0f172a; color:${corAcento};`,
    industrial: `background:${corAcento}33; color:${corAcento}; font-family: 'Courier New', monospace;`,
  };
  const thStyle = thBase[estiloTabela] ?? thBase.moderno;

  const tabelaExtra: Record<PdfTema['estiloTabela'], string> = {
    moderno: `.tabela td { padding: 7px 8px; border-bottom: 1px solid ${corAcento}22; }`,
    listrado: `.listrado { background: ${corAcento}11; }
               .tabela td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }`,
    minimal: `.tabela td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; border-left: none; border-right: none; }
              .tabela { border: none; }`,
    elegante: `.tabela td { padding: 7px 10px; border-bottom: 1px solid ${corAcento}33; }
               .tabela tr:last-child td { border-bottom: 2px solid ${corAcento}; }`,
    industrial: `.tabela td { padding: 6px 8px; border: 1px solid ${corAcento}44; font-family: 'Courier New', monospace; }
                 .tabela { border: 2px solid ${corAcento}; }`,
  };
  const tdExtra = tabelaExtra[estiloTabela] ?? tabelaExtra.moderno;

  return `
    .cabecalho { background: ${corHeader}; padding: 20px; margin: -28px -28px 20px; }
    .empresa-nome { color: ${corTextoHeader}; font-size: 18px; font-weight: 700; }
    .empresa-info { color: ${corTextoHeader}88; font-size: 11px; margin-top: 3px; }
    .doc-titulo { color: ${corTextoHeader}; font-size: 14px; font-weight: 700; text-align: right; }
    .doc-data { color: ${corTextoHeader}88; font-size: 11px; text-align: right; margin-top: 3px; }
    .secao-titulo {
      font-size: 10px; font-weight: 700; color: ${corSecao};
      text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 2px solid ${corSecao}44; padding-bottom: 5px; margin-bottom: 10px;
    }
    .status-badge { background: ${corAcento}22; color: ${corAcento}; }
    .tabela th { ${thStyle} padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
    ${tdExtra}
    .rodape { color: ${corAcento}66; }
  `;
}

function montarHTML(ordem: OrdemServico, empresa: Empresa, pdfTema: PdfTema, logoBase64?: string) {
  const css = cssParaTema(pdfTema);
  const enderecoEmpresa = [empresa.endereco, empresa.cidade, empresa.estado].filter(Boolean).join(' · ');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; font-family: -apple-system, Helvetica, Arial, sans-serif; }
          body { padding: 28px; color: #1e293b; font-size: 13px; }
          .cabecalho {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 20px;
          }
          .secao { margin-bottom: 18px; }
          .grid { display: flex; flex-wrap: wrap; gap: 14px; }
          .campo { min-width: 140px; }
          .campo-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; }
          .campo-valor { font-size: 12px; color: #1e293b; font-weight: 600; margin-top: 2px; }
          .descricao-texto { font-size: 12px; color: #334155; line-height: 1.6; }
          .status-badge {
            display: inline-block; padding: 3px 10px; border-radius: 5px;
            font-size: 10px; font-weight: 700;
          }
          .tabela { width: 100%; border-collapse: collapse; font-size: 12px; }
          .total-geral { text-align: right; font-size: 12px; margin-top: 6px; }
          .fotos-grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .foto-thumb {
            width: 160px; height: 120px;
            object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;
          }
          .assinaturas { display: flex; gap: 24px; margin-top: 36px; }
          .assinatura-box { flex: 1; text-align: center; }
          .assinatura-img { max-height: 65px; max-width: 100%; }
          .assinatura-vazia { height: 65px; }
          .assinatura-linha { border-top: 1px solid #94a3b8; margin-top: 6px; }
          .assinatura-titulo { font-size: 10px; color: #64748b; margin-top: 5px; }
          .rodape { margin-top: 36px; font-size: 9px; text-align: center; }
          ${css}
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <div style="display:flex; align-items:center; gap:12px;">
            ${logoBase64 ? `<img src="${logoBase64}" style="width:54px; height:54px; object-fit:contain; border-radius:8px; background:#fff; flex-shrink:0;" />` : ''}
            <div>
              <div class="empresa-nome">${empresa.nome}</div>
              ${empresa.cnpj ? `<div class="empresa-info">CNPJ: ${empresa.cnpj}</div>` : ''}
              ${enderecoEmpresa ? `<div class="empresa-info">${enderecoEmpresa}</div>` : ''}
              ${empresa.telefone ? `<div class="empresa-info">${empresa.telefone}</div>` : ''}
            </div>
          </div>
          <div>
            <div class="doc-titulo">ORDEM DE SERVIÇO</div>
            <div class="doc-data">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div class="secao">
          <div class="secao-titulo">Cliente</div>
          <div class="grid">
            <div class="campo">
              <div class="campo-label">Nome</div>
              <div class="campo-valor" style="font-size:15px;">${ordem.cliente}</div>
            </div>
            ${ordem.clienteTelefone ? `
            <div class="campo">
              <div class="campo-label">Telefone</div>
              <div class="campo-valor">${ordem.clienteTelefone}</div>
            </div>` : ''}
          </div>
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
              <div class="campo-label">Criada em</div>
              <div class="campo-valor">${ordem.dataCriacao}</div>
            </div>
            ${ordem.tecnicoResponsavel ? `
            <div class="campo">
              <div class="campo-label">Técnico</div>
              <div class="campo-valor">${ordem.tecnicoResponsavel}</div>
            </div>` : ''}
          </div>
        </div>

        ${ordem.descricao ? `
        <div class="secao">
          <div class="secao-titulo">Descrição do Serviço</div>
          <div class="descricao-texto">${ordem.descricao}</div>
        </div>` : ''}

        ${secaoPeriodos(ordem.diasExecucao ?? [], pdfTema.corAcento)}
        ${secaoPecas(ordem.pecas ?? [], pdfTema.estiloTabela)}
        ${secaoFotos(ordem.fotos ?? [])}

        <div class="assinaturas">
          ${blocoAssinatura('Assinatura do Técnico', ordem.assinaturaTecnico)}
          ${blocoAssinatura('Assinatura do Cliente', ordem.assinaturaCliente)}
        </div>

        <div class="rodape">Documento gerado pelo ServiOS · ${empresa.nome}</div>
      </body>
    </html>`;
}

export async function gerarESalvarPdfOS(
  ordem: OrdemServico,
  empresa: Empresa,
  pdfTema: PdfTema = PDF_TEMA_PADRAO,
  logoBase64?: string,
) {
  const html = montarHTML(ordem, empresa, pdfTema, logoBase64);
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
