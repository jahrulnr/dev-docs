#!/usr/bin/env node
/**
 * Scan dev-docs corpus and emit index.json + routing-table.md for fast agent lookup.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');

/** Manual synonyms merged into keywords (slug → extra terms). */
const ALIASES = {
  'best-practices/architecture/patterns/clean-architecture': [
    'clean arch', 'uncle bob', 'ports adapters layers',
  ],
  'best-practices/architecture/patterns/hexagonal-architecture': [
    'ports and adapters', 'hex arch',
  ],
  'best-practices/architecture/patterns/ddd': [
    'domain driven design', 'bounded context', 'aggregate',
  ],
  'best-practices/architecture/styles/microservices-architecture': [
    'microservice', 'micro services', 'msa',
  ],
  'best-practices/architecture/styles/event-driven-architecture': [
    'eda', 'event driven',
  ],
  'best-practices/architecture/styles/serverless-architecture': [
    'faas', 'lambda architecture',
  ],
  'best-practices/patterns/reliability/circuit-breaker': [
    'hystrix', 'resilience', 'fallback',
  ],
  'best-practices/patterns/reliability/retry': ['exponential backoff', 'retries'],
  'best-practices/patterns/reliability/timeout': ['timeouts', 'deadline'],
  'best-practices/patterns/reliability/bulkhead': ['isolation', 'thread pool isolation'],
  'best-practices/patterns/integration/cqrs': ['command query separation'],
  'best-practices/patterns/integration/event-sourcing': ['event store'],
  'best-practices/patterns/integration/saga': ['choreography', 'orchestration saga'],
  'best-practices/patterns/integration/api-gateway': ['bff gateway', 'edge gateway'],
  'best-practices/patterns/data-access/repository': ['repo pattern'],
  'best-practices/principles/solid': ['srp', 'ocp', 'lsp', 'isp', 'dip'],
  'best-practices/principles/security/zero-trust': ['ztna', 'never trust always verify'],
  'technologies/infrastructure/kubernetes': ['k8s', 'kube', 'pods', 'helm charts runtime'],
  'technologies/infrastructure/docker': ['container', 'dockerfile', 'oci image'],
  'technologies/infrastructure/terraform': ['iac', 'hcl', 'tfstate'],
  'technologies/infrastructure/kafka': ['event streaming', 'confluent'],
  'technologies/infrastructure/rabbitmq': ['amqp broker', 'message queue'],
  'technologies/infrastructure/nginx': ['reverse proxy', 'load balancer'],
  'technologies/infrastructure/prometheus': ['metrics', 'promql'],
  'technologies/infrastructure/elk-stack': ['elasticsearch', 'logstash', 'kibana', 'elastic'],
  'technologies/infrastructure/istio': ['service mesh', 'envoy sidecar'],
  'technologies/protocols/http': ['http2', 'http3', 'rest', 'https'],
  'technologies/protocols/grpc': ['protobuf rpc', 'http2 rpc'],
  'technologies/protocols/graphql': ['gql', 'apollo'],
  'technologies/protocols/websocket': ['ws', 'full duplex'],
  'technologies/protocols/sse': ['server sent events', 'event stream'],
  'technologies/protocols/mqtt': ['iot messaging', 'pubsub mqtt'],
  'ecosystem/aws/compute': ['ec2', 'lambda', 'ecs', 'fargate', 'aws compute'],
  'ecosystem/aws/storage': ['s3', 'ebs', 'efs', 'glacier'],
  'ecosystem/aws/database': ['rds', 'dynamodb', 'aurora', 'elasticache'],
  'ecosystem/aws/networking': ['vpc', 'cloudfront', 'route53', 'alb'],
  'ecosystem/aws/security': ['iam', 'cognito', 'kms', 'waf'],
  'ecosystem/aws/event-driven': ['sns', 'sqs', 'eventbridge', 'kinesis'],
  'ecosystem/aws/deployment': ['codepipeline', 'codedeploy', 'cicd aws'],
  'ecosystem/aws/monitoring': ['cloudwatch', 'x-ray'],
  'ecosystem/azure/compute': ['azure vm', 'azure functions', 'aks'],
  'ecosystem/azure/database': ['cosmos db', 'azure sql'],
  'ecosystem/google-cloud/compute': ['gce', 'gke', 'cloud run'],
  'ecosystem/google-cloud/database': ['cloud sql', 'firestore', 'spanner'],
  'ecosystem/google-cloud/storage': ['gcs', 'cloud storage'],
};

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith('_en.md')) acc.push(full);
  }
  return acc;
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function slugToKeywords(slug) {
  const base = basename(slug);
  const parts = base.split('/').flatMap((p) => p.split('-').filter(Boolean));
  const phrase = base.replace(/\//g, ' ').replace(/-/g, ' ');
  return [...new Set([phrase, ...parts])];
}

function pillarFromSlug(slug) {
  const [top, second, third] = slug.split('/');
  if (top === 'ecosystem') return { pillar: 'ecosystem', subpillar: second };
  if (top === 'technologies') return { pillar: 'technologies', subpillar: second };
  if (top === 'best-practices') {
    if (second === 'architecture') return { pillar: 'architecture', subpillar: third };
    if (second === 'anti-patterns') return { pillar: 'anti-patterns', subpillar: null };
    return { pillar: second, subpillar: third };
  }
  return { pillar: top, subpillar: second };
}

function buildEntry(enPath) {
  const rel = relative(ROOT, enPath);
  const slug = relative(DOCS, enPath).replace(/_en\.md$/, '');
  const idPath = enPath.replace(/_en\.md$/, '_id.md');
  const content = readFileSync(enPath, 'utf8');
  const title = extractTitle(content) ?? slug.split('/').pop().replace(/-/g, ' ');
  const { pillar, subpillar } = pillarFromSlug(slug);
  const keywords = new Set([
    ...slugToKeywords(slug),
    title.toLowerCase(),
    ...(ALIASES[slug] ?? []),
  ]);
  return {
    id: slug.split('/').pop(),
    slug,
    path_en: rel,
    path_id: rel.replace(/_en\.md$/, '_id.md'),
    title,
    pillar,
    subpillar,
    keywords: [...keywords].sort(),
  };
}

function renderRoutingTable(entries) {
  const lines = [
    '# Dev-docs routing table',
    '',
    'Auto-generated. Regenerate: `node scripts/build-index.mjs`',
    '',
    '| Keywords (sample) | English | Indonesian |',
    '| --- | --- | --- |',
  ];
  for (const e of entries) {
    const sample = e.keywords.slice(0, 4).join(', ');
    lines.push(`| ${sample} | \`${e.path_en}\` | \`${e.path_id}\` |`);
  }
  lines.push('');
  return lines.join('\n');
}

const files = walk(DOCS).sort();
const entries = files.map(buildEntry);

const index = {
  version: 1,
  base: ROOT,
  generated: new Date().toISOString(),
  count: entries.length,
  entries,
};

writeFileSync(join(ROOT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
writeFileSync(join(ROOT, 'routing-table.md'), renderRoutingTable(entries));
console.log(`Wrote index.json (${entries.length} entries) and routing-table.md`);
