function setupAutoSelectZeroFields(container = document) {
    const numberInputs = container.querySelectorAll('input[type="number"]:not([data-auto-select-configured])');
    
    numberInputs.forEach(input => {
        input.setAttribute('data-auto-select-configured', 'true');
        
        const selectIfZero = function() {
            const value = parseFloat(this.value);
            if (value === 0 || this.value === '' || this.value === '0' || isNaN(value)) {
                setTimeout(() => {
                    this.select();
                }, 0);
            }
        };
        
        input.addEventListener('focus', selectIfZero);
        
        input.addEventListener('mousedown', function(e) {
            const value = parseFloat(this.value);
            if (value === 0 || this.value === '' || this.value === '0' || isNaN(value)) {
                e.preventDefault();
                this.focus();
                setTimeout(() => {
                    this.select();
                }, 0);
            }
        });
        
        input.addEventListener('click', selectIfZero);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setupAutoSelectZeroFields();
    });
} else {
    setupAutoSelectZeroFields();
}

if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'INPUT' && node.type === 'number') {
                            setupAutoSelectZeroFields(node.parentElement);
                        } else if (node.querySelectorAll) {
                            const numberInputs = node.querySelectorAll('input[type="number"]');
                            if (numberInputs.length > 0) {
                                setupAutoSelectZeroFields(node);
                            }
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

