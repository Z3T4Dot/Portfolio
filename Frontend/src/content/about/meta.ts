// Blueprint 05 §Estructura (content/about/meta.ts: pilares, habilidades y etapas del timeline con
// slugs), 02 §About, 01 §Perfil profesional (los cuatro pilares) y 07 §Estructura del trabajo en la
// V1. Cada texto condensa una redacción pública confirmada por César (C2); lo que no la tiene no está
// aquí. Las traducciones al inglés son borradores hasta F9.
//
// Solo lo importan loaders (corren en el build): las etapas `draft` nunca llegan al cliente, y el
// postbuild falla si sus textos aparecen en el build (scripts/lib/draft-leaks.ts).
import type { AboutMeta } from '../schema'

export const aboutMeta = {
  formalTitle: {
    es: 'Desarrollador Junior en Brandex (desde julio de 2025)',
    en: 'Junior Developer at Brandex (since July 2025)',
  },
  // Por área, separadas del cargo formal: el cargo nunca se reemplaza por un título implícito.
  responsibilities: {
    es: [
      'Arquitectura y backend: diseñé la arquitectura e implementé la plataforma del backend (runtime y SDK, identidad y autorización, gateway, motor de workflows y CI/CD).',
      'Dirección técnica: asumí la dirección técnica y tecnológica en un equipo de tres personas; definí tareas, revisé y audité el código y resolví bloqueos técnicos. El liderazgo formal del proyecto estuvo a cargo del diseñador de interfaz.',
      'Operaciones: diseñé el modelo de cobro y costeo de una operación y sus procesos de recepción, almacenamiento y despacho, y lideré su puesta en marcha.',
    ],
    en: [
      'Architecture and backend: I designed the architecture and implemented the backend platform (runtime and SDK, identity and authorization, gateway, workflow engine and CI/CD).',
      'Technical direction: I took on the technical and technology direction in a team of three; I defined tasks, reviewed and audited the code and cleared technical blockers. The formal project lead was the interface designer.',
      'Operations: I designed the pricing and cost model of an operation and its receiving, storage and dispatch processes, and led its launch.',
    ],
  },
  education: {
    es: 'Tecnólogo en Análisis y Desarrollo de Software (ADSO), SENA, 2025',
    en: 'Technologist in Software Analysis and Development (ADSO), SENA, 2025',
  },
  // Habilidades en lista simple, sin niveles (02, 03 "Qué evitar"). La evidencia de cada pilar sale de
  // los casos visibles que lo declaran en `pillars` (CaseStudyMeta); no se repite aquí.
  pillars: [
    {
      id: 'engineering',
      skills: {
        es: [
          'Arquitectura de backend modular y documentada',
          'SDK y runtime propios para que los módulos de negocio no dependan entre sí',
          'Java y PostgreSQL',
          'Frontend, API, microservicios y despliegue',
          'Integraciones con Supabase y Airtable',
          'CI/CD con pruebas de arquitectura y migraciones sobre una base limpia',
        ],
        en: [
          'Modular, documented backend architecture',
          'An in-house SDK and runtime so that business modules do not depend on each other',
          'Java and PostgreSQL',
          'Frontend, APIs, microservices and deployment',
          'Integrations with Supabase and Airtable',
          'CI/CD with architecture tests and migrations run against a clean database',
        ],
      },
    },
    {
      id: 'security',
      skills: {
        es: [
          'Identidad y autorización',
          'Autorización aplicada por el runtime en cada petición',
          'Autenticación entre servicios',
          'Análisis de seguridad de caja gris contra el OWASP Top 10, con verificación del cierre de cada hallazgo',
        ],
        en: [
          'Identity and authorization',
          'Authorization enforced by the runtime on every request',
          'Service-to-service authentication',
          'Gray-box security assessment against the OWASP Top 10, verifying that each finding was closed',
        ],
      },
    },
    {
      id: 'leadership',
      skills: {
        es: [
          'Dirección técnica en un equipo de tres personas',
          'Definición de tareas y resolución de bloqueos técnicos',
          'Revisión y auditoría de código',
          'Arquitectura documentada en un blueprint y ADRs',
          'Integración del trabajo del equipo en una plataforma común',
        ],
        en: [
          'Technical direction in a team of three',
          'Defining tasks and clearing technical blockers',
          'Code review and code audits',
          'Architecture documented in a blueprint and ADRs',
          "Integrating the team's work into a shared platform",
        ],
      },
    },
    {
      id: 'business-systems',
      skills: {
        es: [
          'Modelo de cobro y costeo de una operación',
          'Procesos de recepción, almacenamiento y despacho',
          'Puesta en marcha de una operación, coordinando a personas de bodega',
          'Datos que el equipo de negocio gestiona sin depender de TI',
        ],
        en: [
          'Pricing and cost model for an operation',
          'Receiving, storage and dispatch processes',
          'Launching an operation while coordinating warehouse staff',
          'Data that the business team manages without depending on IT',
        ],
      },
    },
  ],
  // Desde el ingreso a Brandex (2025-07-04): antes no hay trabajo con evidencia que mostrar (07).
  // Las etapas que nombran productos internos de Brandex son `draft` hasta su permiso (C1 en 15).
  // Sin etapa todavía, por falta de redacción pública confirmada: Experiencias (sin periodo),
  // Wazuh SOC Lab, micrositio de evento y NEXT.
  timeline: [
    {
      slug: 'brandex',
      publication: 'published',
      start: '2025-07',
      end: null,
      title: { es: 'Desarrollador Junior en Brandex', en: 'Junior Developer at Brandex' },
    },
    {
      slug: 'connectme',
      publication: 'draft',
      start: '2025-09',
      end: '2026-05',
      title: { es: 'ConnectMe', en: 'ConnectMe' },
      summary: {
        es: 'Portal corporativo: diseñé y construí todo el software, frontend y 11 microservicios. Desplegado a producción, no lanzado.',
        en: 'Corporate portal: I designed and built all of the software, the frontend and 11 microservices. Deployed to production, not launched.',
      },
    },
    {
      slug: 'quantum',
      publication: 'draft',
      start: '2026-04',
      end: '2026-09',
      title: { es: 'Quantum', en: 'Quantum' },
      summary: {
        es: 'Nació como una iniciativa mía. Diseñé la arquitectura e implementé la plataforma del backend, y asumí la dirección técnica y tecnológica en un equipo de tres personas. Implementado y desplegado; traspasé el proyecto a finales de septiembre de 2026.',
        en: 'It started as my own initiative. I designed the architecture and implemented the backend platform, and took on the technical and technology direction in a team of three. Implemented and deployed; I handed the project over at the end of September 2026.',
      },
      projects: ['quantum'],
    },
    {
      slug: 'keepme',
      publication: 'draft',
      start: '2026-09',
      end: null,
      title: { es: 'KeepMe', en: 'KeepMe' },
      summary: {
        es: 'Custodia de material de marca. Diseñé el modelo de cobro y costeo de la operación y los procesos de recepción, almacenamiento y despacho, lideré su puesta en marcha y construí el módulo de software que la soporta.',
        en: 'Custody of branded materials. I designed the pricing and cost model of the operation and its receiving, storage and dispatch processes, led its launch and built the software module that supports it.',
      },
    },
  ],
} satisfies AboutMeta
