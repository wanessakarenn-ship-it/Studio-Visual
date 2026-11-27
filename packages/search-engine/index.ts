import {ArticleSchema} from '../content-engine';
type Check={name:string;weight:number;passed:boolean;evidence:string};
export function auditArticle(input:unknown){const a=ArticleSchema.parse(input),body=a.body.trim(),keyword=a.keyword.trim().toLocaleLowerCase('pt-BR'),title=a.title.toLocaleLowerCase('pt-BR');const seo:Check[]=[
{name:'Título e palavra-chave',weight:25,passed:!!keyword&&title.includes(keyword),evidence:'Correspondência textual; não mede intenção de busca.'},
{name:'Descrição editorial',weight:20,passed:a.description.trim().length>=50&&a.description.length<=160,evidence:'Heurística editorial de comprimento, não regra de ranking.'},
{name:'Hierarquia de seções',weight:25,passed:/^## .+/m.test(body)&&!/^# /m.test(body),evidence:'H1 gerado pelo título; subtítulos H2 no corpo.'},
{name:'Slug definido',weight:10,passed:!!a.slug,evidence:'Formato validado pelo schema.'},
{name:'Conteúdo presente',weight:20,passed:body.length>0,evidence:'Presença de texto; qualidade e intenção exigem revisão.'}];
const geo:Check[]=[
{name:'Autoria declarada',weight:35,passed:!!a.author.trim(),evidence:'Não verifica credenciais.'},
{name:'Referências declaradas',weight:35,passed:a.sources.length>0,evidence:'Não verifica conteúdo, autoridade ou exatidão das fontes.'},
{name:'Estrutura extraível',weight:30,passed:/^## .+/m.test(body),evidence:'Presença de subtítulos; não prevê citações.'}];
const score=(checks:Check[])=>checks.reduce((sum,c)=>sum+(c.passed?c.weight:0),0);
return {version:'local-heuristics-0.1',seo:{score:score(seo),checks:seo},geo:{score:score(geo),checks:geo},limitations:'Triagem local parcial. Não mede indexação, ranking, autoridade, intenção ou visibilidade em IA.'};}
