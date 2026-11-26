import sys, zipfile
from html.parser import HTMLParser
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.images=[]; self.styles=[]; self.scripts=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='img': self.images.append(a.get('src',''))
        if tag=='link' and a.get('rel')=='stylesheet': self.styles.append(a.get('href'))
        if tag=='script': self.scripts+=1
with zipfile.ZipFile(sys.argv[1]) as z:
    assert z.testzip() is None
    names=set(z.namelist())
    assert {'index.html','styles.css','studio-document.json','README.md'} <= names
    p=Page(); p.feed(z.read('index.html').decode())
    assert p.scripts==0 and 'styles.css' in p.styles
    assert any(s.startswith('assets/') for s in p.images)
    assert all(s in names for s in p.images if s.startswith('assets/'))
    assert '@media(max-width:767px)' in z.read('styles.css').decode()
print('Independent ZIP and HTML verification passed')
