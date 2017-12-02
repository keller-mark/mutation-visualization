#!/usr/bin/r
library(deconstructSigs)
library(SignatureEstimation)
library(BSgenome.Hsapiens.UCSC.hg19)

selected_columns <- c("icgc_sample_id", "chromosome", "chromosome_start", "reference_genome_allele", "mutated_to_allele")

somatic_mutations_path <- "/app/data_temp/extracted_data.tsv"
somatic_mutations <- read.table(somatic_mutations_path, sep = '\t', header = TRUE, colClasses = c("factor"))


somatic_mutations_stripped <- somatic_mutations[, which(names(somatic_mutations) %in% selected_columns)]

sample.name.to.id <- function(sample.name) {
  return(as.numeric(gsub("SA", "", as.character(sample.name))))
}

chr.prefix <- function(chr.input) {
  return(paste("chr", as.character(chr.input), sep = ""))
}

start.numeric <- function(start.input) {
  return(as.numeric(as.character(start.input)))
}

somatic_mutations_stripped[,2] <- sapply(somatic_mutations_stripped[,2], chr.prefix)
somatic_mutations_stripped[,3] <- sapply(somatic_mutations_stripped[,3], start.numeric)
somatic_mutations_stripped[,4] <- sapply(somatic_mutations_stripped[,4], as.character)
somatic_mutations_stripped[,5] <- sapply(somatic_mutations_stripped[,5], as.character)

# somatic_mutations_stripped <- somatic_mutations_stripped[!(somatic_mutations_stripped$chromosome=="chrMT"),]

sigs.input <- mut.to.sigs.input(
  mut.ref = somatic_mutations_stripped,
  sample.id = "icgc_sample_id",
  chr = "chromosome",
  pos = "chromosome_start",
  ref = "reference_genome_allele",
  alt = "mutated_to_allele"
)

sigs.input <- sigs.input[, order(colnames(sigs.input))]

tricontext.fractions <- t(getTriContextFraction(sigs.input, trimer.counts.method = 'default'))


sample.names <- colnames(tricontext.fractions)
signature.distributions <- data.frame(matrix(ncol = 30, nrow = 0))
for (i in 1:ncol(tricontext.fractions)) {
  signature.distributions[sample.names[i],] <- decomposeQP(tricontext.fractions[,i], signaturesCOSMIC)
}

#boxplot.matrix(as.matrix(signature.distributions))

write.csv(t(signature.distributions), file = "/app/static/data/signature_distributions_t.csv")