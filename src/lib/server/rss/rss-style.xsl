<?xml version="1.0" encoding="UTF-8"?>
<!--
  Browser-facing stylesheet for /rss.xml: renders a friendly subscribe page
  when a human opens the feed URL directly. Feed readers ignore it entirely.
  Copy is bilingual, chosen from the feed's own <language> element.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <xsl:variable name="pt" select="/rss/channel/language = 'pt-br'"/>
    <html>
      <head>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #07080a;
            color: #ececec;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
          }
          .wrap {
            max-width: 42rem;
            margin: 0 auto;
            padding: 3rem 1.25rem 4rem;
          }
          .badge {
            display: inline-block;
            font-family: ui-monospace, 'SF Mono', Menlo, monospace;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #22e5e5;
            border: 1px solid #22e5e5;
            border-radius: 2px;
            padding: 0.1rem 0.4rem;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.6rem;
            font-weight: 600;
            margin: 0 0 0.5rem;
          }
          .desc { color: #b8bcc2; margin: 0 0 2rem; }
          .how {
            border: 1px solid #24282e;
            border-radius: 4px;
            background: #0b0d12;
            padding: 1rem 1.25rem;
            margin-bottom: 2.5rem;
          }
          .how p { margin: 0 0 0.75rem; color: #b8bcc2; font-size: 0.9rem; }
          .how code {
            display: block;
            font-family: ui-monospace, 'SF Mono', Menlo, monospace;
            font-size: 0.85rem;
            color: #22e5e5;
            background: #07080a;
            border: 1px solid #24282e;
            border-radius: 2px;
            padding: 0.5rem 0.75rem;
            overflow-x: auto;
          }
          .how a { color: #22e5e5; }
          .item {
            padding: 1rem 0;
            border-bottom: 1px solid #24282e;
          }
          .item .date {
            font-family: ui-monospace, 'SF Mono', Menlo, monospace;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #b8bcc2;
          }
          .item h2 { font-size: 1.05rem; font-weight: 500; margin: 0.25rem 0 0.35rem; }
          .item h2 a { color: #ececec; text-decoration: none; }
          .item h2 a:hover { color: #22e5e5; }
          .item p { margin: 0; color: #b8bcc2; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <span class="badge">RSS</span>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>

          <div class="how">
            <p>
              <xsl:choose>
                <xsl:when test="$pt">Isto é um feed RSS. Copie o endereço abaixo e cole no seu leitor de RSS para assinar de graça. Cada artigo novo chega até você assim que é publicado.</xsl:when>
                <xsl:otherwise>This is an RSS feed. Copy the address below into your RSS reader to subscribe for free. Every new article reaches you as soon as it is published.</xsl:otherwise>
              </xsl:choose>
            </p>
            <code><xsl:value-of select="/rss/channel/atom:link/@href"/></code>
            <p style="margin: 0.75rem 0 0;">
              <a>
                <xsl:attribute name="href"><xsl:value-of select="/rss/channel/link"/></xsl:attribute>
                <xsl:choose>
                  <xsl:when test="$pt">Voltar ao RBX Journal</xsl:when>
                  <xsl:otherwise>Back to the RBX Journal</xsl:otherwise>
                </xsl:choose>
              </a>
            </p>
          </div>

          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <span class="date"><xsl:value-of select="substring(pubDate, 1, 16)"/></span>
              <h2>
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                  <xsl:value-of select="title"/>
                </a>
              </h2>
              <p><xsl:value-of select="description"/></p>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
