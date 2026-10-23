from pathlib import Path
import re
import subprocess
import sys
root=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root/'scripts/build-course.py')], check=True)
base=root/'dist'
html=(base/'index.html').read_text()
html=html.replace('<html lang="en">','<html lang="en" data-offline="true">')
def css(match):
    source=(base/match.group(1).split('?')[0]).read_text()
    source=re.sub(r'@import[^;]+;', '', source)
    return '<style>'+source+'</style>'
def js(match):
    source=(base/match.group(1).split('?')[0]).read_text()
    source=re.sub(r'</script',r'<\\/script',source,flags=re.I)
    return '<script>'+source+'</script>'
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',css,html)
html=re.sub(r'<script src="([^"]+)"></script>',js,html)
# The offline button saves a pristine copy captured before the editor initializes.
html=html.replace('href="vim-fieldwork-offline.html"','href="#"')
license_text=(base/'vendor/LICENSE').read_text().replace('--','—')
html=html.replace('</head>','<!-- CodeMirror license\n'+license_text+'\n--></head>')
assert not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"|@import',html)
(base/'vim-fieldwork-offline.html').write_text(html)
print('Built single-file offline app:',len(html.encode()),'bytes')
