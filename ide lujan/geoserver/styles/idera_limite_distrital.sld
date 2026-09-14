<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" 
    xmlns="http://www.opengis.net/sld" 
    xmlns:ogc="http://www.opengis.net/ogc" 
    xmlns:xlink="http://www.w3.org/1999/xlink" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <Name>idera_limite_distrital</Name>
    <UserStyle>
      <Title>Límites Distritales de Luján de Cuyo - Norma IDERA</Title>
      <Abstract>Estilo de polígonos distritales con trazo punteado y etiquetas centradas</Abstract>
      <FeatureTypeStyle>
        <Rule>
          <Name>Distrito_Poligono</Name>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#003366</CssParameter>
              <CssParameter name="fill-opacity">0.08</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#003366</CssParameter>
              <CssParameter name="stroke-width">1.8</CssParameter>
              <CssParameter name="stroke-dasharray">6 3</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
          <TextSymbolizer>
            <Label>
              <ogc:PropertyName>distrito</ogc:PropertyName>
            </Label>
            <Font>
              <CssParameter name="font-family">Arial</CssParameter>
              <CssParameter name="font-size">11</CssParameter>
              <CssParameter name="font-weight">bold</CssParameter>
            </Font>
            <Halo>
              <Radius>2</Radius>
              <Fill>
                <CssParameter name="fill">#FFFFFF</CssParameter>
              </Fill>
            </Halo>
            <Fill>
              <CssParameter name="fill">#002244</CssParameter>
            </Fill>
            <VendorOption name="autoWrap">80</VendorOption>
            <VendorOption name="maxDisplacement">20</VendorOption>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
