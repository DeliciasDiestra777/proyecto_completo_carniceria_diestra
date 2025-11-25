async function diagnosticarImagenes() {
    console.log('Iniciando diagnóstico de imágenes...\n');
    
    try {
        console.log('Verificando endpoint de diagnóstico del backend...');
        try {
            const diagResponse = await fetch('http://localhost:3000/api/productos/verificar-imagenes');
            const diagData = await diagResponse.json();
            
            console.log(`Carpeta productos: ${diagData.carpeta_productos}`);
            console.log(`Carpeta existe: ${diagData.carpeta_existe}`);
            console.log(`Total productos con imagen en BD: ${diagData.total_productos_con_imagen}`);
            console.log(`Total archivos físicos: ${diagData.total_archivos_fisicos}`);
            
            console.log(`\nVerificando productos individuales...\n`);
            diagData.productos_verificados.forEach(producto => {
                if (producto.existe) {
                    console.log(`${producto.nombre_producto}: Archivo existe`);
                    console.log(`  ${producto.imagen}`);
                    console.log(`  ${producto.url_acceso}`);
                } else {
                    console.log(`${producto.nombre_producto}: Archivo NO existe`);
                    console.log(`  ${producto.imagen}`);
                    console.log(`  Ruta física: ${producto.ruta_fisica}`);
                    console.log(`  ${producto.url_acceso}`);
                }
            });
            
            console.log(`\nArchivos físicos encontrados (primeros 10):`);
            diagData.archivos_fisicos.forEach(archivo => {
                console.log(`  ${archivo}`);
            });
            
        } catch (error) {
            console.log(`No se pudo usar el endpoint de diagnóstico: ${error.message}`);
            console.log(`Continuando con verificación manual...\n`);
        }
        
        console.log('\nVerificando productos desde la API...');
        const response = await fetch('http://localhost:3000/api/productos/catalogo');
        const data = await response.json();
        const productos = data.productos || [];
        
        console.log(`Se encontraron ${productos.length} productos\n`);
        
        console.log('Verificando acceso a imágenes...\n');
        const productosConImagen = [];
        const productosSinImagen = [];
        const productosConError = [];
        
        for (const producto of productos) {
            const tieneImagen = producto.imagen && producto.imagen.trim() !== '' && producto.imagen !== 'null';
            
            if (tieneImagen) {
                productosConImagen.push(producto);
                const urlImagen = `http://localhost:3000/uploads/productos/${producto.imagen}`;
                
                try {
                    const imgResponse = await fetch(urlImagen, { method: 'HEAD' });
                    if (imgResponse.ok) {
                        console.log(`${producto.nombre_producto}: Imagen accesible`);
                    } else {
                        console.log(`${producto.nombre_producto}: Imagen no accesible - Status: ${imgResponse.status}`);
                        productosConError.push({ producto, url: urlImagen, status: imgResponse.status });
                    }
                } catch (error) {
                    console.log(`${producto.nombre_producto}: Error al verificar - ${error.message}`);
                    productosConError.push({ producto, url: urlImagen, error: error.message });
                }
            } else {
                productosSinImagen.push(producto);
            }
        }
        
        console.log(`\nResumen:`);
        console.log(`  - Productos con imagen en BD: ${productosConImagen.length}`);
        console.log(`  - Productos sin imagen en BD: ${productosSinImagen.length}`);
        console.log(`  - Productos con error al cargar: ${productosConError.length}`);
        
        if (productosConError.length > 0) {
            console.log(`\nProductos con problemas:`);
            productosConError.forEach(item => {
                console.log(`  ${item.producto.nombre_producto}`);
                console.log(`    URL: ${item.url}`);
                if (item.status) {
                    console.log(`    Status: ${item.status}`);
                }
                if (item.error) {
                    console.log(`    Error: ${item.error}`);
                }
            });
        }
        
        console.log(`\nDiagnóstico completado`);
        console.log(`\nRecomendaciones:`);
        if (productosConError.length > 0) {
            console.log(`  - Verifica que los archivos existan en: backend_delicias_diestra/uploads/productos/`);
            console.log(`  - Verifica que el servidor esté corriendo y sirviendo archivos estáticos`);
            console.log(`  - Revisa los logs del backend para ver si hay errores`);
        }
        
    } catch (error) {
        console.error('Error durante el diagnóstico:', error);
    }
}

diagnosticarImagenes();

