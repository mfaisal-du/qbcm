import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const CELL_BIOLOGY_CLO_SLO_DATA = {
  clos: {
    CLO1: 'Describe the structure and function of eukaryotic cells and their organelles.',
    CLO2: 'Explain fundamental molecular biology processes.',
    CLO3: 'Explain gene regulation, DNA repair, and cell cycle mechanisms.',
    CLO4: 'Analyze the relationship between cellular defects and human diseases.',
    CLO5: 'Integrate molecular mechanisms with clinical manifestations to explain disease processes.',
    CLO6: 'Demonstrate teamwork, scientific communication, and application of ethical principles.'
  },
  topics: {
    'Topic 1 - Introduction to Cell Biology & Clinical Relevance; role of cell organelles': {
      sloPrefix: 'SLO1',
      slos: [
        'Define cell theory and its historical development',
        'Differentiate between prokaryotic and eukaryotic cells',
        'Explain the importance of cell biology in understanding human disease',
        'Identify examples of diseases resulting from cellular dysfunction (e.g., cystic fibrosis, sickle cell anemia)',
        'Recognize the link between cellular structure and physiological function'
      ]
    },
    'Topic 2 - Cell Types & Plasma Membrane': {
      sloPrefix: 'SLO2',
      slos: [
        'Classify cells based on structural and functional characteristics',
        'Describe the fluid mosaic model of the plasma membrane',
        'Explain membrane components and their functions',
        'Compare different membrane transport mechanisms',
        'Relate membrane defects to disease states'
      ]
    },
    'Topic 3 - Cytoskeleton & Cell-Cell junctions (TBL)/ Cell signaling': {
      sloPrefix: 'SLO3',
      slos: [
        'Identify components of the cell-cell junctions and cytoskeleton',
        'Explain mechanisms of cell motility',
        'Compare microtubules, microfilaments, and intermediate filaments',
        'Analyze diseases associated with cytoskeletal defects',
        'Classify cell signaling types by distance (autocrine, paracrine, endocrine)',
        'Differentiate hydrophobic vs. hydrophilic ligands and their receptor locations',
        'Describe the stages of signaling: reception -> transduction -> response (including second messengers)',
        'Compare GPCRs, enzyme-coupled receptors, and ion channel receptors and their typical downstream effects'
      ]
    },
    'Topic 4 - DNA: Structure, Organization, and Packaging': {
      sloPrefix: 'SLO4',
      slos: [
        'Describe the chemical structure and components of DNA',
        'Explain base pairing, antiparallel strands, and DNA stability mechanisms',
        'Differentiate between chromatin, nucleosomes, and chromosomes',
        'Identify levels of DNA organization',
        'Explain the clinical relevance of DNA structure in chemotherapy mechanisms'
      ]
    },
    'Topic 5 - DNA replication and mitosis': {
      sloPrefix: 'SLO5',
      slos: [
        'Describe the major steps of DNA replication',
        'Identify key enzymes involved in replication',
        'Explain replication fidelity and proofreading',
        'Distinguish between leading vs lagging strand synthesis',
        'Describe the stages of mitosis and the key events in each stage'
      ]
    },
    'Topic 6 - Meiosis and genetic diversity': {
      sloPrefix: 'SLO6',
      slos: [
        'Define meiosis and explain its biological importance',
        'Describe the stages and key events of meiosis I and II',
        'Explain mechanisms of genetic diversity',
        'Compare mitosis and meiosis',
        'Interpret the concepts of ploidy and DNA content'
      ]
    },
    'Topic 7 - RNA structure and types': {
      sloPrefix: 'SLO7',
      slos: [
        'Describe the basic structure and components of RNA',
        'Compare RNA and DNA in terms of structure, stability, and function',
        'Identify and explain the functions of the three major types of RNA',
        'Explain how RNA structure is modified after synthesis',
        'Relate RNA defects to disease mechanisms'
      ]
    },
    'Topic 8 - Gene Expression I –Transcription "From DNA to RNA: Initiating Gene Expression"': {
      sloPrefix: 'SLO8',
      slos: [
        'Define transcription and explain its biological significance',
        'Identify the key components involved in transcription',
        'Describe the characters of the genetic code',
        'Describe the steps of transcription: initiation, elongation, and termination',
        'Differentiate between prokaryotic and eukaryotic transcription'
      ]
    },
    'Topic 9 - Gene Expression II –Translation "from mRNA to protein"': {
      sloPrefix: 'SLO9',
      slos: [
        'Define translation and explain its role in gene expression',
        'Identify the key components required for translation',
        'Describe the steps of translation: initiation, elongation, and termination',
        'Explain the roles of mRNA, tRNA, and ribosomes in protein synthesis',
        'Understand how translation is affected by clinically important agents such as antibiotics and toxins'
      ]
    },
    'Topic 10 - DNA Mutations and Protein Dysfunction': {
      sloPrefix: 'SLO10',
      slos: [
        'Define mutation and describe its types',
        'Explain point mutations and their effects on protein structure and function',
        'Describe chromosomal (macromutations) and their clinical significance',
        'Explain the role of mutations in disease development'
      ]
    },
    'Topic 11 - DNA repair and cell cycle': {
      sloPrefix: 'SLO11',
      slos: [
        'Define DNA damage and describe its main types',
        'Explain the major DNA repair mechanisms',
        'Differentiate between single-strand and double-strand repair pathways',
        'Describe the phases of the cell cycle and the role of checkpoints',
        'Relate defects in DNA repair and cell cycle control to clinical conditions (e.g., cancer)'
      ]
    },
    'Topic 12 - Regulation of Gene Expression': {
      sloPrefix: 'SLO12',
      slos: [
        'Define gene expression',
        'Explain why cells need to control gene activity',
        'Describe how genes can be switched on or off',
        'Explain the basic concept of an operon',
        'Describe the main components of the lac operon',
        'Explain how lactose and glucose affect lac operon activity',
        'Describe basic mechanisms of gene regulation in human cells'
      ]
    },
    'Topic 13 - DNA Cloning — The Basics': {
      sloPrefix: 'SLO13',
      slos: [
        'Define DNA cloning',
        'Describe the role of restriction enzymes in cutting DNA',
        'Explain why plasmids are used in DNA cloning',
        'Identify the essential features of a cloning plasmid',
        'Outline the basic steps of DNA cloning',
        'Describe how recombinant bacterial colonies are selected'
      ]
    },
    'Topic 14 - From Genes to Genomes': {
      sloPrefix: 'SLO14',
      slos: [
        'Define DNA libraries',
        'Differentiate genomic libraries and cDNA libraries',
        'Explain the basic principle of PCR',
        'Describe the main steps of PCR',
        'Explain the concept of DNA fingerprinting',
        'Describe the basic idea of the Human Genome Project',
        'Identify selected medical applications of recombinant DNA technology',
        'Discuss basic ethical issues related to genetic technology'
      ]
    }
  }
};

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'com_question_bank',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  try {
    const [subRows] = await pool.execute('SELECT id FROM subjects WHERE name = ?', ['Cell Biology']);
    if (subRows.length === 0) {
      console.error('Cell Biology subject not found. Run migrate_plan_of_study.js first.');
      process.exit(1);
    }
    const subjectId = subRows[0].id;

    // Ensure topics exist
    const [existingTopics] = await pool.execute('SELECT id, name FROM topics WHERE subjectId = ?', [subjectId]);
    const existingTopicNames = existingTopics.map(t => t.name);

    const cellBiologyTopics = Object.keys(CELL_BIOLOGY_CLO_SLO_DATA.topics);
    for (const topicName of cellBiologyTopics) {
      if (!existingTopicNames.includes(topicName)) {
        await pool.execute('INSERT INTO topics (subjectId, name) VALUES (?, ?)', [subjectId, topicName]);
        console.log(`Created topic: ${topicName}`);
      }
    }

    const [topicRows] = await pool.execute('SELECT id, name FROM topics WHERE subjectId = ?', [subjectId]);
    const topicMap = {};
    topicRows.forEach(t => { topicMap[t.name] = t.id; });
    console.log(`Found ${topicRows.length} Cell Biology topics`);

    // Clear existing CLOs and SLOs
    await pool.execute('DELETE FROM slos WHERE topicId IN (SELECT id FROM topics WHERE subjectId = ?)', [subjectId]);
    await pool.execute('DELETE FROM clos WHERE subjectId = ?', [subjectId]);
    console.log('Cleared existing CLOs/SLOs');

    // Insert new CLOs
    const cloRows = [];
    for (const [code, description] of Object.entries(CELL_BIOLOGY_CLO_SLO_DATA.clos)) {
      const [result] = await pool.execute('INSERT INTO clos (subjectId, code, description) VALUES (?, ?, ?)', [subjectId, code, description]);
      cloRows.push({ id: result.insertId, code });
      console.log(`Created CLO: ${code}`);
    }

    // Insert SLOs for each topic
    let sloCount = 0;
    for (const topicName of Object.keys(CELL_BIOLOGY_CLO_SLO_DATA.topics)) {
      const topicData = CELL_BIOLOGY_CLO_SLO_DATA.topics[topicName];
      const topicId = topicMap[topicName];
      if (!topicId) {
        console.warn(`Topic not found: ${topicName}`);
        continue;
      }

      const cloId = cloRows.find(c => c.code === 'CLO1')?.id;
      if (!cloId) {
        console.error('CLO1 not found');
        continue;
      }

      for (let i = 0; i < topicData.slos.length; i++) {
        const sloCode = `${topicData.sloPrefix}.${i + 1}`;
        await pool.execute('INSERT INTO slos (cloId, topicId, code, description) VALUES (?, ?, ?, ?)', [cloId, topicId, sloCode, topicData.slos[i]]);
        sloCount++;
      }
      console.log(`Created ${topicData.slos.length} SLOs for ${topicName}`);
    }

    console.log(`\nSeed complete! Created ${cloRows.length} CLOs and ${sloCount} SLOs for Cell Biology.`);
  } catch (error) {
    console.error('Seed error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();

export default CELL_BIOLOGY_CLO_SLO_DATA;
