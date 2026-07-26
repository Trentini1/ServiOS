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

const STATUS_CORES: Record<string, string> = {
  'Aberta': '#d97706',
  'Em Andamento': '#2563eb',
  'Concluída': '#16a34a',
};

const PRIORIDADE_CORES: Record<string, string> = {
  Baixa: '#64748b',
  Normal: '#2563eb',
  Alta: '#d97706',
  Urgente: '#dc2626',
};

function escapeHtml(valor?: string | number | null): string {
  if (valor === undefined || valor === null) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(valor?: string): string {
  if (!valor) return '';
  return escapeHtml(valor).replace(/\n/g, '<br/>');
}

function isoParaBR(iso: string) {
  return iso.split('-').reverse().join('/');
}

function calcularMinutos(dia: DiaExecucao): number {
  let totalMin = 0;
  for (const p of dia.periodos) {
    const [eh, em] = p.entrada.split(':').map(Number);
    const [sh, sm] = p.saida.split(':').map(Number);
    if (!isNaN(eh) && !isNaN(em) && !isNaN(sh) && !isNaN(sm)) {
      const diff = sh * 60 + sm - (eh * 60 + em);
      if (diff > 0) totalMin += diff;
    }
  }
  return totalMin;
}

function formatarMinutos(totalMin: number): string {
  if (!totalMin) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m > 0 ? `${m.toString().padStart(2, '0')}min` : ''}`;
}

function badge(texto?: string, cor?: string): string {
  if (!texto || !cor) return '';
  return `<span class="badge" style="background:${cor}1f; color:${cor};">${escapeHtml(texto)}</span>`;
}

function campo(label: string, valor?: string | number | null): string {
  if (valor === undefined || valor === null || valor === '') return '';
  return `
    <div class="campo">
      <div class="campo-label">${escapeHtml(label)}</div>
      <div class="campo-valor">${escapeHtml(valor)}</div>
    </div>`;
}

function campoHtml(label: string, html: string): string {
  return `
    <div class="campo">
      <div class="campo-label">${escapeHtml(label)}</div>
      <div class="campo-valor">${html}</div>
    </div>`;
}

function blocoAssinatura(titulo: string, imagemBase64?: string, destaque?: string) {
  const tituloHtml = destaque
    ? `<div class="assinatura-titulo" style="color:${destaque};">${escapeHtml(titulo)}</div>`
    : `<div class="assinatura-titulo">${escapeHtml(titulo)}</div>`;
  if (imagemBase64) {
    return `
      <div class="assinatura-box">
        <img src="${imagemBase64}" class="assinatura-img" />
        <div class="assinatura-linha"></div>
        ${tituloHtml}
      </div>`;
  }
  return `
    <div class="assinatura-box">
      <div class="assinatura-vazia"></div>
      <div class="assinatura-linha"></div>
      ${tituloHtml}
    </div>`;
}

function calcularDensidade(ordem: OrdemServico): number {
  let pontos = 0;
  if (ordem.clienteTelefone) pontos++;
  if (ordem.tecnicoResponsavel) pontos++;
  if (ordem.dataAgendada) pontos++;
  if (ordem.prioridade) pontos++;
  if (ordem.tempoEstimado) pontos++;
  if (ordem.garantia !== undefined) pontos++;
  if (ordem.modelo) pontos++;
  if (ordem.ano) pontos++;
  if (ordem.placa) pontos++;
  if (ordem.horimetro) pontos++;
  if (ordem.tipoVeiculo) pontos++;
  if (ordem.seguro) pontos++;
  if (ordem.descricao) pontos += 2;
  if (ordem.valorEstimado) pontos++;
  if (ordem.formaPagamento) pontos++;
  if (ordem.solicitante) pontos++;
  if (ordem.contatoSolicitante) pontos++;
  if (ordem.enderecoServico) pontos++;
  if (ordem.diasExecucao?.length) pontos += 2;
  if (ordem.pecas?.length) pontos += 2;
  if (ordem.fotos?.length) pontos += 3;
  return pontos;
}

function resumoServico(ordem: OrdemServico, cor: string): string {
  const dias = ordem.diasExecucao ?? [];
  const diasOrdenados = [...dias].sort((a, b) => a.data.localeCompare(b.data));
  const totalGeral = formatarMinutos(dias.reduce((acc, dia) => acc + calcularMinutos(dia), 0));

  const linhasPeriodo = diasOrdenados.map((dia) => {
    const periodosTexto = dia.periodos
      .filter((p) => p.entrada && p.saida)
      .map((p) => `${escapeHtml(p.entrada)}&rarr;${escapeHtml(p.saida)}`)
      .join('&nbsp;&nbsp;');
    return `<div class="resumo-linha-periodo">${isoParaBR(dia.data)}&nbsp;&nbsp;${periodosTexto || '&mdash;'}</div>`;
  }).join('');

  return `
    <div class="resumo-box" style="border-left-color:${cor};">
      <div class="resumo-lado">
        <div class="campo-label">Tipo de Manutenção</div>
        <div class="resumo-valor">${escapeHtml(ordem.tipoManutencao)}</div>
      </div>
      <div class="resumo-lado resumo-lado-direita">
        <div class="campo-label" style="text-align:right;">Períodos de Execução</div>
        ${linhasPeriodo || '<div class="resumo-linha-periodo" style="color:#94a3b8;">Ainda não iniciada</div>'}
        ${totalGeral ? `<div class="resumo-total" style="color:${cor}; border-color:${cor}33;">Total: ${totalGeral}</div>` : ''}
      </div>
    </div>`;
}

function secaoPecas(pecas: PecaUtilizada[], estilo: PdfTema['estiloTabela']): string {
  if (!pecas || pecas.length === 0) return '';
  const linhas = pecas.map((p, i) => `
    <tr${estilo === 'listrado' && i % 2 === 0 ? ' class="listrado"' : ''}>
      <td>${escapeHtml(p.descricao)}</td>
      <td style="text-align:center;">${escapeHtml(p.quantidade)} ${escapeHtml(p.unidade)}</td>
      <td>${escapeHtml(p.fornecedor) || '&mdash;'}</td>
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
  const itens = fotos.map((f, i) => `
    <div class="foto-item">
      <div class="foto-thumb-wrap"><img src="${f}" /></div>
      <div class="foto-caption">Foto ${i + 1}</div>
    </div>`).join('');

  return `
    <div class="secao">
      <div class="secao-titulo">Registro Fotográfico (${fotos.length} foto${fotos.length > 1 ? 's' : ''})</div>
      <div class="fotos-grid">${itens}</div>
    </div>`;
}

function cssParaTema(pdfTema: PdfTema): string {
  const { corHeader, corAcento, corTextoHeader, corSecao, estiloTabela } = pdfTema;
  const thBase: Record<PdfTema['estiloTabela'], string> = {
    moderno: `background:${corAcento}1f; color:${corAcento};`,
    listrado: 'background:#f8fafc; color:#475569;',
    minimal: 'background:transparent; color:#374151; border-bottom:2px solid #e2e8f0;',
    elegante: `background:#0f172a; color:${corAcento};`,
    industrial: `background:${corAcento}33; color:${corAcento}; font-family: 'Courier New', monospace;`,
  };
  const thStyle = thBase[estiloTabela] ?? thBase.moderno;

  const tabelaExtra: Record<PdfTema['estiloTabela'], string> = {
    moderno: `.tabela td { padding: 8px 10px; border-bottom: 1px solid #eef2f7; }
              .tabela tr:last-child td { border-bottom: none; }`,
    listrado: `.listrado { background: ${corAcento}0d; }
               .tabela td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }`,
    minimal: `.tabela td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; border-left: none; border-right: none; }
              .tabela { border: none; }`,
    elegante: `.tabela td { padding: 8px 12px; border-bottom: 1px solid ${corAcento}33; }
               .tabela tr:last-child td { border-bottom: 2px solid ${corAcento}; }`,
    industrial: `.tabela td { padding: 7px 10px; border: 1px solid ${corAcento}44; font-family: 'Courier New', monospace; }
                 .tabela { border: 2px solid ${corAcento}; }`,
  };
  const tdExtra = tabelaExtra[estiloTabela] ?? tabelaExtra.moderno;

  return `
    .cabecalho { border-bottom: 4px solid ${corAcento}; }
    .empresa-nome { color: ${corHeader}; }
    .empresa-tag { background: ${corHeader}; color: ${corTextoHeader}; }
    .doc-numero { color: ${corAcento}; }
    .secao-titulo {
      font-size: 10px; font-weight: 700; color: ${corSecao};
      text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 2px solid ${corSecao}33; padding-bottom: 6px; margin-bottom: 12px;
      page-break-after: avoid;
    }
    .chip-titulo {
      font-size: 10.5px; font-weight: 700; color: ${corSecao};
      text-transform: uppercase; letter-spacing: 0.4px;
      background: ${corSecao}14; border-left: 3px solid ${corSecao};
      padding: 5px 9px; margin-bottom: 8px; page-break-after: avoid;
    }
    .tabela th { ${thStyle} padding: 7px 10px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; }
    ${tdExtra}
    .rodape { color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .rodape strong { color: ${corAcento}; }
  `;
}

function montarHTML(ordem: OrdemServico, empresa: Empresa, pdfTema: PdfTema, logoBase64?: string) {
  const css = cssParaTema(pdfTema);
  const enderecoEmpresa = [empresa.endereco, empresa.cidade, empresa.estado].filter(Boolean).map(escapeHtml).join(' · ');
  const contatoEmpresa = [empresa.telefone, empresa.email].filter(Boolean).map(escapeHtml).join(' · ');
  const corStatus = STATUS_CORES[ordem.status] ?? pdfTema.corAcento;
  const corPrioridade = ordem.prioridade ? (PRIORIDADE_CORES[ordem.prioridade] ?? pdfTema.corAcento) : undefined;
  const espacoso = calcularDensidade(ordem) <= 3;

  const infoGeral = [
    campo('Telefone do Cliente', ordem.clienteTelefone),
    campo('Motor / Equipamento', ordem.motor),
    campo('Posição', ordem.posicao),
    campo('Técnico Responsável', ordem.tecnicoResponsavel),
    campo('Criada em', ordem.dataCriacao),
    ordem.dataAgendada ? campo('Data Agendada', isoParaBR(ordem.dataAgendada)) : '',
    ordem.prioridade ? campoHtml('Prioridade', badge(ordem.prioridade, corPrioridade)) : '',
    campo('Tempo Estimado', ordem.tempoEstimado),
    ordem.garantia !== undefined ? campoHtml('Garantia', ordem.garantia ? badge('Em Garantia', '#16a34a') : '<span class="campo-valor-simples">Não</span>') : '',
    campo('Modelo', ordem.modelo),
    campo('Ano', ordem.ano),
    campo('Placa / Nº de Série', ordem.placa),
    campo('Horímetro / KM', ordem.horimetro),
    campo('Tipo de Veículo', ordem.tipoVeiculo),
    campo('Nº do Seguro', ordem.seguro),
  ].filter(Boolean).join('');

  const infoFinanceiro = [
    campo('Valor Estimado', ordem.valorEstimado ? `R$ ${ordem.valorEstimado}` : undefined),
    campo('Forma de Pagamento', ordem.formaPagamento),
  ].filter(Boolean).join('');

  const infoSolicitante = [
    campo('Solicitante', ordem.solicitante),
    campo('Contato do Solicitante', ordem.contatoSolicitante),
    campo('Endereço do Serviço', ordem.enderecoServico),
  ].filter(Boolean).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 56px 40px; }
          * { box-sizing: border-box; font-family: -apple-system, Helvetica, Arial, sans-serif; }
          html, body {
            -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
          }
          body { margin: 0; padding: 0; color: #1e293b; font-size: 13px; line-height: 1.45; }

          .cabecalho {
            display: flex; justify-content: space-between; align-items: flex-start;
            padding: 0 0 14px; margin: 0 0 22px;
          }
          .empresa-bloco { display: flex; align-items: center; gap: 14px; }
          .empresa-logo {
            width: 60px; height: 60px; object-fit: contain; border-radius: 8px;
            background: #ffffff; border: 1px solid #e2e8f0; flex-shrink: 0; padding: 4px;
          }
          .empresa-nome { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1; }
          .empresa-tag {
            display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.6px; padding: 2px 8px; border-radius: 3px; margin-top: 5px;
          }
          .empresa-info { font-size: 10.5px; color: #64748b; margin-top: 3px; }
          .doc-bloco { text-align: right; }
          .doc-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; }
          .doc-numero { font-size: 20px; font-weight: 800; margin-top: 2px; font-family: 'Courier New', monospace; line-height: 1.1; }
          .doc-cliente-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 10px; }
          .doc-cliente { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; }
          .doc-data { font-size: 9.5px; color: #94a3b8; margin-top: 8px; }
          .doc-status { margin-top: 6px; }

          .resumo-box {
            display: flex; justify-content: space-between; align-items: flex-start; gap: 18px;
            background: #f8fafc; border-left: 4px solid; border-radius: 6px;
            padding: 10px 16px; margin-bottom: 20px; page-break-inside: avoid;
          }
          .resumo-lado { flex: 1; }
          .resumo-lado-direita { text-align: right; }
          .resumo-valor { font-size: 13.5px; font-weight: 700; margin-top: 3px; }
          .resumo-linha-periodo { font-size: 10.5px; font-weight: 600; font-family: 'Courier New', monospace; margin-top: 2px; }
          .resumo-total {
            font-size: 10px; font-weight: 700; margin-top: 5px; padding-top: 5px; border-top: 1px solid;
          }

          .secao { margin-bottom: 20px; page-break-inside: avoid; }
          .grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .campo {
            min-width: 128px; flex: 1 1 128px;
            border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc;
            padding: 7px 10px;
          }
          .campo-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; }
          .campo-valor { font-size: 11.5px; color: #1e293b; font-weight: 700; margin-top: 3px; }
          .campo-valor-simples { font-size: 11.5px; color: #64748b; font-weight: 700; margin-top: 3px; }
          .descricao-texto { font-size: 12.5px; color: #334155; line-height: 1.7; white-space: pre-line; }
          .badge {
            display: inline-block; padding: 3px 10px; border-radius: 5px;
            font-size: 10px; font-weight: 700;
          }
          .tabela { width: 100%; border-collapse: collapse; font-size: 12px; }
          .tabela tr { page-break-inside: avoid; }

          .fotos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .foto-item { page-break-inside: avoid; break-inside: avoid; }
          .foto-thumb-wrap {
            height: 170px; display: flex; align-items: center; justify-content: center;
            border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; padding: 6px;
          }
          .foto-thumb-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; }
          .foto-caption { font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 5px; text-align: center; }

          .assinaturas { display: flex; gap: 28px; margin-top: 40px; page-break-inside: avoid; }
          .assinatura-box { flex: 1; text-align: center; }
          .assinatura-img { max-height: 65px; max-width: 100%; }
          .assinatura-vazia { height: 65px; }
          .assinatura-linha { border-top: 1px solid #94a3b8; margin-top: 6px; }
          .assinatura-titulo { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 5px; }

          .rodape {
            margin-top: 40px; padding-top: 12px; font-size: 9.5px; text-align: center;
            text-transform: uppercase; letter-spacing: 0.3px;
          }

          /* Modo espaçoso: OS com pouco conteúdo ganham tipografia e respiro maiores
             em vez de ficar com a página curta e cheia de espaço em branco solto. */
          body.espacoso { font-size: 15px; line-height: 1.75; }
          body.espacoso .empresa-nome { font-size: 28px; }
          body.espacoso .doc-numero { font-size: 23px; }
          body.espacoso .doc-cliente { font-size: 17px; }
          body.espacoso .resumo-box { padding: 16px 22px; margin-bottom: 26px; }
          body.espacoso .resumo-valor { font-size: 16px; }
          body.espacoso .resumo-linha-periodo { font-size: 12px; }
          body.espacoso .secao { margin-bottom: 30px; }
          body.espacoso .grid { gap: 12px; }
          body.espacoso .campo { padding: 11px 15px; min-width: 160px; }
          body.espacoso .campo-label { font-size: 9px; }
          body.espacoso .campo-valor { font-size: 13px; }
          body.espacoso .descricao-texto { font-size: 14.5px; line-height: 1.95; }
          body.espacoso .assinaturas { margin-top: 64px; }
          ${css}
        </style>
      </head>
      <body class="${espacoso ? 'espacoso' : ''}">
        <div class="cabecalho">
          <div class="empresa-bloco">
            ${logoBase64 ? `<img src="${logoBase64}" class="empresa-logo" />` : ''}
            <div>
              <div class="empresa-nome">${escapeHtml(empresa.nome)}</div>
              ${empresa.segmento ? `<div class="empresa-tag">${escapeHtml(empresa.segmento)}</div>` : ''}
              ${empresa.cnpj ? `<div class="empresa-info">CNPJ: ${escapeHtml(empresa.cnpj)}</div>` : ''}
              ${enderecoEmpresa ? `<div class="empresa-info">${enderecoEmpresa}</div>` : ''}
              ${contatoEmpresa ? `<div class="empresa-info">${contatoEmpresa}</div>` : ''}
            </div>
          </div>
          <div class="doc-bloco">
            <div class="doc-label">Ordem de Serviço Nº</div>
            <div class="doc-numero">${ordem.numeroOS ? escapeHtml(ordem.numeroOS) : '&mdash;'}</div>
            <div class="doc-cliente-label">Cliente</div>
            <div class="doc-cliente">${escapeHtml(ordem.cliente)}</div>
            <div class="doc-status">${badge(ordem.status, corStatus)}</div>
            <div class="doc-data">Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        ${resumoServico(ordem, pdfTema.corAcento)}

        <div class="secao">
          <div class="secao-titulo">Informações Gerais</div>
          <div class="grid">${infoGeral}</div>
        </div>

        ${ordem.descricao ? `
        <div class="secao">
          <div class="chip-titulo">Descrição do Serviço</div>
          <div class="descricao-texto">${nl2br(ordem.descricao)}</div>
        </div>` : ''}

        ${infoFinanceiro ? `
        <div class="secao">
          <div class="secao-titulo">Financeiro</div>
          <div class="grid">${infoFinanceiro}</div>
        </div>` : ''}

        ${infoSolicitante ? `
        <div class="secao">
          <div class="secao-titulo">Solicitante</div>
          <div class="grid">${infoSolicitante}</div>
        </div>` : ''}

        ${secaoPecas(ordem.pecas ?? [], pdfTema.estiloTabela)}
        ${secaoFotos(ordem.fotos ?? [])}

        <div class="assinaturas">
          ${blocoAssinatura('Assinatura do Técnico', ordem.assinaturaTecnico, pdfTema.corAcento)}
          ${blocoAssinatura('Assinatura do Cliente', ordem.assinaturaCliente)}
        </div>

        <div class="rodape">Documento gerado pelo <strong>ServiOS</strong> · ${escapeHtml(empresa.nome)}</div>
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
