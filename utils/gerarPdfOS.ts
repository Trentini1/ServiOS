import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { OrdemServico, DiaExecucao, PecaUtilizada } from '../screens/OSListScreen';

type Empresa = {
  nome: string;
  cnpj: string;
  telefone: string;
  segmento: string;
  cidade: string;
  estado: string;
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

function secaoPeriodos(dias: DiaExecucao[]): string {
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
        <td style="text-align:center; font-weight:700; color:#d97706;">${total}</td>
      </tr>`;
  }).join('');

  return `
    <div class="secao">
      <div class="secao-titulo">Períodos de Execução</div>
      <table class="tabela">
        <thead>
          <tr><th>Data</th><th>Períodos</th><th>Total</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
      ${totalGeral ? `<div class="total-geral">Total geral: <strong>${totalGeral}</strong></div>` : ''}
    </div>`;
}

function secaoPecas(pecas: PecaUtilizada[]): string {
  if (!pecas || pecas.length === 0) return '';
  const linhas = pecas.map((p) => `
    <tr>
      <td>${p.descricao}</td>
      <td style="text-align:center;">${p.quantidade} ${p.unidade}</td>
      <td>${p.fornecedor || '—'}</td>
    </tr>`).join('');

  return `
    <div class="secao">
      <div class="secao-titulo">Peças Utilizadas</div>
      <table class="tabela">
        <thead>
          <tr><th>Descrição</th><th>Quantidade</th><th>Fornecedor</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

function secaoFotos(fotos: string[]): string {
  if (!fotos || fotos.length === 0) return '';
  // Para PDF: usa as imagens já em base64, limitadas a 3 por linha e tamanho controlado por CSS
  const imgs = fotos.map((f) =>
    `<img src="${f}" class="foto-thumb" />`
  ).join('');
  return `
    <div class="secao">
      <div class="secao-titulo">Registro Fotográfico (${fotos.length} foto${fotos.length > 1 ? 's' : ''})</div>
      <div class="fotos-grid">${imgs}</div>
    </div>`;
}

function montarHTML(ordem: OrdemServico, empresa: Empresa) {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; font-family: -apple-system, Helvetica, Arial, sans-serif; }
          body { padding: 28px; color: #1e293b; font-size: 13px; }
          .cabecalho {
            display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;
          }
          .empresa-nome { font-size: 18px; font-weight: 700; color: #0b1220; }
          .empresa-info { font-size: 11px; color: #64748b; margin-top: 3px; }
          .doc-titulo { font-size: 14px; font-weight: 700; color: #2563eb; text-align: right; }
          .doc-data { font-size: 11px; color: #64748b; text-align: right; margin-top: 3px; }
          .secao { margin-bottom: 18px; }
          .secao-titulo {
            font-size: 10px; font-weight: 700; color: #2563eb;
            text-transform: uppercase; letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;
          }
          .grid { display: flex; flex-wrap: wrap; gap: 14px; }
          .campo { min-width: 140px; }
          .campo-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; }
          .campo-valor { font-size: 12px; color: #1e293b; font-weight: 600; margin-top: 2px; }
          .descricao-texto { font-size: 12px; color: #334155; line-height: 1.5; }
          .status-badge {
            display: inline-block; padding: 3px 10px; border-radius: 5px;
            font-size: 10px; font-weight: 700; background: #2563eb22; color: #2563eb;
          }
          .tabela { width: 100%; border-collapse: collapse; font-size: 12px; }
          .tabela th {
            background: #f1f5f9; text-align: left; padding: 6px 8px;
            font-size: 10px; color: #64748b; text-transform: uppercase;
          }
          .tabela td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
          .tabela tr:last-child td { border-bottom: none; }
          .total-geral { text-align: right; font-size: 12px; color: #d97706; margin-top: 6px; }
          .fotos-grid {
            display: flex; flex-wrap: wrap; gap: 8px;
          }
          .foto-thumb {
            width: 160px; height: 120px;
            object-fit: cover; border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .assinaturas { display: flex; gap: 24px; margin-top: 36px; }
          .assinatura-box { flex: 1; text-align: center; }
          .assinatura-img { max-height: 65px; max-width: 100%; }
          .assinatura-vazia { height: 65px; }
          .assinatura-linha { border-top: 1px solid #94a3b8; margin-top: 6px; }
          .assinatura-titulo { font-size: 10px; color: #64748b; margin-top: 5px; }
          .rodape { margin-top: 36px; font-size: 9px; color: #cbd5e1; text-align: center; }
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <div>
            <div class="empresa-nome">${empresa.nome}</div>
            <div class="empresa-info">CNPJ: ${empresa.cnpj}</div>
            <div class="empresa-info">${empresa.cidade}/${empresa.estado} · ${empresa.telefone}</div>
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
              <div class="campo-label">Técnico responsável</div>
              <div class="campo-valor">${ordem.tecnicoResponsavel}</div>
            </div>` : ''}
          </div>
        </div>

        ${ordem.descricao ? `
        <div class="secao">
          <div class="secao-titulo">Descrição do Serviço</div>
          <div class="descricao-texto">${ordem.descricao}</div>
        </div>` : ''}

        ${secaoPeriodos(ordem.diasExecucao ?? [])}
        ${secaoPecas(ordem.pecas ?? [])}
        ${secaoFotos(ordem.fotos ?? [])}

        <div class="assinaturas">
          ${blocoAssinatura('Assinatura do Técnico', ordem.assinaturaTecnico)}
          ${blocoAssinatura('Assinatura do Cliente', ordem.assinaturaCliente)}
        </div>

        <div class="rodape">Documento gerado pelo ServiOS · ${empresa.nome}</div>
      </body>
    </html>`;
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
